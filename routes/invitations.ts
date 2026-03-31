import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, mapToCamelCase } from "../db";
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
  syncHandler((req, res) => {
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

    db.prepare(
      `
        INSERT INTO invitations (id, event_id, invitee_name, email, allowed_guests, token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      id,
      parsed.eventId,
      parsed.inviteeName,
      parsed.email ?? null,
      parsed.allowedGuests,
      token,
      createdAt,
    );

    res.json({ id, token, inviteeName: parsed.inviteeName, createdAt });
  }),
);

router.get(
  "/events/:eventId/invitations",
  syncHandler((req, res) => {
    const invitations = db
      .prepare("SELECT * FROM invitations WHERE event_id = ?")
      .all(req.params.eventId) as InvitationRow[];
    res.json(mapToCamelCase(invitations));
  }),
);

router.delete(
  "/invitations/:id",
  syncHandler((req, res) => {
    const id = (req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Invitation id required" });
    }

    const existing = db
      .prepare("SELECT id FROM invitations WHERE id = ?")
      .get(id) as { id: string } | undefined;
    if (!existing) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const deleteInvitation = db.transaction((invitationId: string) => {
      db.prepare("DELETE FROM guest_groups WHERE invitation_id = ?").run(
        invitationId,
      );
      db.prepare("DELETE FROM invitations WHERE id = ?").run(invitationId);
    });

    deleteInvitation(id);
    res.json({ success: true });
  }),
);

router.get(
  "/rsvp/:token",
  syncHandler((req, res) => {
    const invitation = db
      .prepare(
        `
          SELECT i.*,
                 e.name as name,
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
          WHERE i.token = ?
        `,
      )
      .get(req.params.token) as Record<string, unknown> | undefined;

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
  syncHandler((req, res) => {
    const parsed = RsvpSchema.parse(req.body);
    const invitation = db
      .prepare("SELECT * FROM invitations WHERE token = ?")
      .get(parsed.token) as InvitationRow | undefined;

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (parsed.attendance === "No") {
      db.prepare(
        "UPDATE invitations SET status = 'Responded', responded_at = ? WHERE id = ?",
      ).run(new Date().toISOString(), invitation.id);
      return res.json({ success: true, message: "RSVP received" });
    }

    const guestGroupId = uuidv4();
    const groupSize = parsed.attendees.length;
    const createdAt = new Date().toISOString();

    const saveRsvp = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO guest_groups (id, event_id, invitation_id, attendees, group_size, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        guestGroupId,
        invitation.event_id,
        invitation.id,
        JSON.stringify(parsed.attendees),
        groupSize,
        parsed.note ?? null,
        createdAt,
      );

      db.prepare(
        "UPDATE invitations SET status = 'Responded', responded_at = ? WHERE id = ?",
      ).run(createdAt, invitation.id);
    });

    saveRsvp();
    res.json({ success: true, guestGroupId });
  }),
);

export default router;
