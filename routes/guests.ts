import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { pool, mapToCamelCase } from "../db";
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
  syncHandler(async (req, res) => {
    const parsed = GuestSchema.parse({
      ...req.body,
      eventId: req.body.eventId ?? req.body.event_id,
    });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await pool.query(
      `INSERT INTO guest_groups (id, event_id, attendees, group_size, note, table_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        parsed.eventId,
        JSON.stringify(parsed.attendees),
        parsed.attendees.length,
        parsed.note ?? null,
        parsed.tableId ?? null,
        createdAt,
      ],
    );

    res.json({ id, success: true });
  }),
);

router.get(
  "/events/:eventId/guests",
  syncHandler(async (req, res) => {
    const { rows } = await pool.query<GuestGroupRow>(
      "SELECT * FROM guest_groups WHERE event_id = $1",
      [req.params.eventId],
    );

    const mapped = mapToCamelCase(rows) as unknown as Array<Record<string, unknown>>;
    const normalized = mapped.map((guest) => ({
      ...guest,
      attendees: Array.isArray(guest.attendees)
        ? guest.attendees
        : JSON.parse(String(guest.attendees ?? "[]")),
    }));

    res.json(normalized);
  }),
);

router.patch(
  "/guests/:id",
  syncHandler(async (req, res) => {
    const id = req.params.id;
    const parsed = GuestPatchSchema.parse(req.body);
    const { rows } = await pool.query<GuestGroupRow>(
      "SELECT * FROM guest_groups WHERE id = $1",
      [id],
    );
    const existing = rows[0];

    if (!existing) {
      res.status(404).json({ error: "Guest group not found" });
      return;
    }

    const attendees = parsed.attendees
      ? JSON.stringify(parsed.attendees)
      : existing.attendees;
    const groupSize = parsed.attendees ? parsed.attendees.length : existing.group_size;
    const note = parsed.note !== undefined ? parsed.note : existing.note;
    const tableId = parsed.tableId !== undefined ? parsed.tableId : existing.table_id;
    const arrivedAt = parsed.arrivedAt !== undefined ? parsed.arrivedAt : existing.arrived_at;

    await pool.query(
      "UPDATE guest_groups SET attendees = $1, group_size = $2, note = $3, table_id = $4, arrived_at = $5 WHERE id = $6",
      [attendees, groupSize, note ?? null, tableId ?? null, arrivedAt ?? null, id],
    );

    res.json({ success: true });
  }),
);

router.delete(
  "/guests/:id",
  syncHandler(async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM guest_groups WHERE id = $1",
      [req.params.id],
    );
    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Guest group not found" });
      return;
    }
    res.json({ success: true });
  }),
);

export default router;
