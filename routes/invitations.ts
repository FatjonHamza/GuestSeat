import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { pool, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { InvitationRow } from "../types/db";

const router = Router();

const InvitationSchema = z.object({
  eventId: z.string().min(1),
  inviteeName: z.string().min(1),
  allowedGuests: z.coerce.number().int().min(0),
  email: z.string().email().nullable().optional(),
});

const RsvpSchema = z.object({
  token: z.string().min(1),
  attendees: z.array(z.string()).optional().default([]),
  note: z.string().nullable().optional(),
  attendance: z.enum(["Yes", "No"]),
});

router.post(
  "/invitations",
  syncHandler(async (req, res) => {
    const parsed = InvitationSchema.parse({
      ...req.body,
      eventId: req.body.eventId ?? req.body.event_id,
      inviteeName: req.body.inviteeName ?? req.body.invitee_name,
      allowedGuests: req.body.allowedGuests ?? req.body.allowed_guests,
      email: req.body.email ?? null,
    });

    const id = uuidv4();
    const token = uuidv4().split("-")[0];
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO invitations (id, event_id, invitee_name, email, allowed_guests, token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, parsed.eventId, parsed.inviteeName, parsed.email ?? null, parsed.allowedGuests, token, createdAt],
    );

    res.json({ id, token, inviteeName: parsed.inviteeName, createdAt });
  }),
);

router.get(
  "/events/:eventId/invitations",
  syncHandler(async (req, res) => {
    const { rows } = await pool.query<InvitationRow>(
      "SELECT * FROM invitations WHERE event_id = $1",
      [req.params.eventId],
    );
    res.json(mapToCamelCase(rows));
  }),
);

router.delete(
  "/invitations/:id",
  syncHandler(async (req, res) => {
    const id = (req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Invitation id required" });
    }

    const { rows } = await pool.query<{ id: string }>(
      "SELECT id FROM invitations WHERE id = $1",
      [id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM guest_groups WHERE invitation_id = $1", [id]);
      await client.query("DELETE FROM invitations WHERE id = $1", [id]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true });
  }),
);

router.get(
  "/rsvp/:token",
  syncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT i.*,
              e.name as name,
              e.bride_name as bride_name,
              e.closing_message as closing_message,
              e.date as date,
              e.time as time,
              e.venue_name as venue_name,
              e.venue_address as venue_address,
              e.venue_map_url as venue_map_url,
              e.message as message,
              e.rsvp_deadline as rsvp_deadline,
              e.theme as theme,
              e.invitation_headline as invitation_heading
       FROM invitations i
       JOIN events e ON i.event_id = e.id
       WHERE i.token = $1`,
      [req.params.token],
    );
    const invitation = rows[0] as Record<string, unknown> | undefined;

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const mapped = mapToCamelCase(invitation) as Record<string, unknown>;
    mapped.invitationHeading =
      (mapped.invitationHeading as string | null | undefined) ??
      (mapped.invitationHeadline as string | null | undefined) ??
      null;
    delete mapped.invitationHeadline;
    res.json(mapped);
  }),
);

router.post(
  "/rsvp",
  syncHandler(async (req, res) => {
    const parsed = RsvpSchema.parse(req.body);
    const { rows } = await pool.query<InvitationRow>(
      "SELECT * FROM invitations WHERE token = $1",
      [parsed.token],
    );
    const invitation = rows[0];

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (parsed.attendance === "No") {
      await pool.query(
        "UPDATE invitations SET status = 'Responded', responded_at = $1 WHERE id = $2",
        [new Date().toISOString(), invitation.id],
      );
      return res.json({ success: true, message: "RSVP received" });
    }

    const guestGroupId = uuidv4();
    const groupSize = parsed.attendees.length;
    const createdAt = new Date().toISOString();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO guest_groups (id, event_id, invitation_id, attendees, group_size, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          guestGroupId,
          invitation.event_id,
          invitation.id,
          JSON.stringify(parsed.attendees),
          groupSize,
          parsed.note ?? null,
          createdAt,
        ],
      );
      await client.query(
        "UPDATE invitations SET status = 'Responded', responded_at = $1 WHERE id = $2",
        [createdAt, invitation.id],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, guestGroupId });
  }),
);

export default router;
