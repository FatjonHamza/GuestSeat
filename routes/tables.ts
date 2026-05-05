import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { pool, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { TableRow } from "../types/db";

const router = Router();

const TableSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  capacity: z.coerce.number().int().positive(),
});

const AssignTableSchema = z.object({
  guestGroupId: z.string().min(1),
  tableId: z.string().nullable().optional(),
});

router.post(
  "/tables",
  syncHandler(async (req, res) => {
    const parsed = TableSchema.parse({
      ...req.body,
      eventId: req.body.eventId ?? req.body.event_id,
    });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await pool.query(
      "INSERT INTO tables (id, event_id, name, capacity, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, parsed.eventId, parsed.name, parsed.capacity, createdAt],
    );

    res.json({ id, name: parsed.name, capacity: parsed.capacity, eventId: parsed.eventId, createdAt });
  }),
);

router.get(
  "/events/:eventId/tables",
  syncHandler(async (req, res) => {
    const { rows } = await pool.query<TableRow>(
      "SELECT * FROM tables WHERE event_id = $1",
      [req.params.eventId],
    );
    res.json(mapToCamelCase(rows));
  }),
);

router.post(
  "/tables/assign",
  syncHandler(async (req, res) => {
    const parsed = AssignTableSchema.parse(req.body);
    await pool.query(
      "UPDATE guest_groups SET table_id = $1 WHERE id = $2",
      [parsed.tableId ?? null, parsed.guestGroupId],
    );
    res.json({ success: true });
  }),
);

export default router;
