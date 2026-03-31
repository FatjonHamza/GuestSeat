import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { GuestGroupRow } from "../types/db";

const router = Router();

const GuestSchema = z.object({
  eventId: z.string().min(1),
  attendees: z.array(z.string()),
  note: z.string().nullable().optional(),
  tableId: z.string().nullable().optional(),
});

const GuestPatchSchema = z.object({
  attendees: z.array(z.string()).optional(),
  note: z.string().nullable().optional(),
  tableId: z.string().nullable().optional(),
  arrivedAt: z.string().nullable().optional(),
});

router.post(
  "/guests",
  syncHandler((req, res) => {
    const parsed = GuestSchema.parse({
      ...req.body,
      eventId: req.body.eventId ?? req.body.event_id,
    });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    db.prepare(
      `
        INSERT INTO guest_groups (id, event_id, attendees, group_size, note, table_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      id,
      parsed.eventId,
      JSON.stringify(parsed.attendees),
      parsed.attendees.length,
      parsed.note ?? null,
      parsed.tableId ?? null,
      createdAt,
    );

    res.json({ id, success: true });
  }),
);

router.get(
  "/events/:eventId/guests",
  syncHandler((req, res) => {
    const guests = db
      .prepare("SELECT * FROM guest_groups WHERE event_id = ?")
      .all(req.params.eventId) as GuestGroupRow[];

    const mapped = mapToCamelCase(guests) as unknown as Array<
      Record<string, unknown>
    >;
    const normalized = mapped.map((guest) => ({
      ...guest,
      attendees: JSON.parse(String(guest.attendees ?? "[]")),
    }));

    res.json(normalized);
  }),
);

router.patch(
  "/guests/:id",
  syncHandler((req, res) => {
    const id = req.params.id;
    const parsed = GuestPatchSchema.parse(req.body);
    const existing = db
      .prepare("SELECT * FROM guest_groups WHERE id = ?")
      .get(id) as GuestGroupRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: "Guest group not found" });
    }

    const attendees = parsed.attendees
      ? JSON.stringify(parsed.attendees)
      : existing.attendees;
    const groupSize = parsed.attendees
      ? parsed.attendees.length
      : existing.group_size;
    const note = parsed.note !== undefined ? parsed.note : existing.note;
    const tableId =
      parsed.tableId !== undefined ? parsed.tableId : existing.table_id;
    const arrivedAt =
      parsed.arrivedAt !== undefined ? parsed.arrivedAt : existing.arrived_at;

    db.prepare(
      "UPDATE guest_groups SET attendees = ?, group_size = ?, note = ?, table_id = ?, arrived_at = ? WHERE id = ?",
    ).run(attendees, groupSize, note ?? null, tableId ?? null, arrivedAt ?? null, id);

    res.json({ success: true });
  }),
);

router.delete(
  "/guests/:id",
  syncHandler((req, res) => {
    const result = db
      .prepare("DELETE FROM guest_groups WHERE id = ?")
      .run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Guest group not found" });
    }
    res.json({ success: true });
  }),
);

export default router;
