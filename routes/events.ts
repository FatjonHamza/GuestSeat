import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { pool, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { EventRow } from "../types/db";

const router = Router();

const EventSchema = z.object({
  name: z.string().min(1),
  brideName: z.string().nullable().optional(),
  closingMessage: z.string().nullable().optional(),
  date: z.string().min(1),
  time: z.string().min(1).nullable().optional(),
  invitationHeading: z.string().nullable().optional(),
  venueName: z.string().min(1),
  venueAddress: z.string().nullable().optional(),
  venueMapUrl: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  rsvpDeadline: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
});

const EventPatchSchema = EventSchema.partial();

function normalizeEventResponse(event: EventRow | Record<string, unknown>) {
  const mapped = mapToCamelCase(event) as Record<string, unknown>;
  mapped.invitationHeading =
    (mapped.invitationHeading as string | null | undefined) ??
    (mapped.invitationHeadline as string | null | undefined) ??
    null;
  delete mapped.invitationHeadline;
  mapped.brideName = (mapped.brideName as string | null | undefined) ?? null;
  mapped.closingMessage = (mapped.closingMessage as string | null | undefined) ?? null;
  return mapped;
}

router.post(
  "/",
  syncHandler(async (req, res) => {
    const parsed = EventSchema.parse({
      ...req.body,
      invitationHeading:
        req.body.invitationHeading ??
        req.body.invitationHeadline ??
        req.body.invitation_heading ??
        req.body.invitation_headline,
      venueName: req.body.venueName ?? req.body.venue_name,
      venueAddress: req.body.venueAddress ?? req.body.venue_address,
      venueMapUrl: req.body.venueMapUrl ?? req.body.venue_map_url,
      rsvpDeadline: req.body.rsvpDeadline ?? req.body.rsvp_deadline,
    });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO events (id, name, bride_name, closing_message, date, time, invitation_headline, venue_name, venue_address, venue_map_url, message, rsvp_deadline, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        parsed.name,
        parsed.brideName ?? null,
        parsed.closingMessage ?? null,
        parsed.date,
        parsed.time ?? null,
        parsed.invitationHeading ?? null,
        parsed.venueName,
        parsed.venueAddress ?? null,
        parsed.venueMapUrl ?? null,
        parsed.message ?? null,
        parsed.rsvpDeadline ?? null,
        parsed.theme ?? "default",
      ],
    );

    res.json({
      id,
      name: parsed.name,
      brideName: parsed.brideName ?? null,
      date: parsed.date,
      venueName: parsed.venueName,
      invitationHeading: parsed.invitationHeading ?? null,
      theme: parsed.theme ?? "default",
    });
  }),
);

router.get(
  "/",
  syncHandler(async (_req, res) => {
    const { rows } = await pool.query<EventRow>("SELECT * FROM events");
    res.json(rows.map((event) => normalizeEventResponse(event)));
  }),
);

router.get(
  "/:id",
  syncHandler(async (req, res) => {
    const { rows } = await pool.query<EventRow>(
      "SELECT * FROM events WHERE id = $1",
      [req.params.id],
    );
    const event = rows[0];
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(normalizeEventResponse(event));
  }),
);

router.patch(
  "/:id",
  syncHandler(async (req, res) => {
    const parsed = EventPatchSchema.parse({
      ...req.body,
      invitationHeading:
        req.body.invitationHeading ??
        req.body.invitationHeadline ??
        req.body.invitation_heading ??
        req.body.invitation_headline,
      venueName: req.body.venueName ?? req.body.venue_name,
      venueAddress: req.body.venueAddress ?? req.body.venue_address,
      venueMapUrl: req.body.venueMapUrl ?? req.body.venue_map_url,
      rsvpDeadline: req.body.rsvpDeadline ?? req.body.rsvp_deadline,
    });

    const fieldMap: Record<string, string> = {
      name: "name",
      brideName: "bride_name",
      closingMessage: "closing_message",
      date: "date",
      time: "time",
      invitationHeading: "invitation_headline",
      venueName: "venue_name",
      venueAddress: "venue_address",
      venueMapUrl: "venue_map_url",
      message: "message",
      rsvpDeadline: "rsvp_deadline",
      theme: "theme",
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [jsKey, colName] of Object.entries(fieldMap)) {
      if (jsKey in parsed && (parsed as Record<string, unknown>)[jsKey] !== undefined) {
        values.push((parsed as Record<string, unknown>)[jsKey]);
        setClauses.push(`${colName} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      res.json({ success: true });
      return;
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE events SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
      values,
    );

    res.json({ success: true });
  }),
);

export default router;
