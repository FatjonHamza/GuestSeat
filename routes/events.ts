import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { EventRow } from "../types/db";

const router = Router();

const EventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1).nullable().optional(),
  venueName: z.string().min(1),
  venueAddress: z.string().nullable().optional(),
  venueMapUrl: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  rsvpDeadline: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
});

const EventPatchSchema = EventSchema.partial();

router.post(
  "/",
  syncHandler((req, res) => {
    const parsed = EventSchema.parse({
      ...req.body,
      venueName: req.body.venueName ?? req.body.venue_name,
      venueAddress: req.body.venueAddress ?? req.body.venue_address,
      venueMapUrl: req.body.venueMapUrl ?? req.body.venue_map_url,
      rsvpDeadline: req.body.rsvpDeadline ?? req.body.rsvp_deadline,
    });

    const id = uuidv4();
    db.prepare(
      `
        INSERT INTO events (id, name, date, time, venue_name, venue_address, venue_map_url, message, rsvp_deadline, theme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      id,
      parsed.name,
      parsed.date,
      parsed.time ?? null,
      parsed.venueName,
      parsed.venueAddress ?? null,
      parsed.venueMapUrl ?? null,
      parsed.message ?? null,
      parsed.rsvpDeadline ?? null,
      parsed.theme ?? "default",
    );

    res.json({
      id,
      name: parsed.name,
      date: parsed.date,
      venueName: parsed.venueName,
      theme: parsed.theme ?? "default",
    });
  }),
);

router.get(
  "/",
  syncHandler((req, res) => {
    const events = db.prepare("SELECT * FROM events").all() as EventRow[];
    res.json(mapToCamelCase(events));
  }),
);

router.get(
  "/:id",
  syncHandler((req, res) => {
    const event = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(req.params.id) as EventRow | undefined;
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(mapToCamelCase(event));
  }),
);

router.patch(
  "/:id",
  syncHandler((req, res) => {
    const parsed = EventPatchSchema.parse({
      ...req.body,
      venueName: req.body.venueName ?? req.body.venue_name,
      venueAddress: req.body.venueAddress ?? req.body.venue_address,
      venueMapUrl: req.body.venueMapUrl ?? req.body.venue_map_url,
      rsvpDeadline: req.body.rsvpDeadline ?? req.body.rsvp_deadline,
    });

    db.prepare(
      `
        UPDATE events
        SET name = COALESCE(?, name),
            date = COALESCE(?, date),
            time = COALESCE(?, time),
            venue_name = COALESCE(?, venue_name),
            venue_address = COALESCE(?, venue_address),
            venue_map_url = COALESCE(?, venue_map_url),
            message = COALESCE(?, message),
            rsvp_deadline = COALESCE(?, rsvp_deadline),
            theme = COALESCE(?, theme)
        WHERE id = ?
      `,
    ).run(
      parsed.name ?? null,
      parsed.date ?? null,
      parsed.time ?? null,
      parsed.venueName ?? null,
      parsed.venueAddress ?? null,
      parsed.venueMapUrl ?? null,
      parsed.message ?? null,
      parsed.rsvpDeadline ?? null,
      parsed.theme ?? null,
      req.params.id,
    );

    res.json({ success: true });
  }),
);

export default router;
