import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, mapToCamelCase } from "../db";
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
  syncHandler((req, res) => {
    const parsed = TableSchema.parse({
      ...req.body,
      eventId: req.body.eventId ?? req.body.event_id,
    });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    db.prepare(
      "INSERT INTO tables (id, event_id, name, capacity, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, parsed.eventId, parsed.name, parsed.capacity, createdAt);

    res.json({
      id,
      name: parsed.name,
      capacity: parsed.capacity,
      eventId: parsed.eventId,
      createdAt,
    });
  }),
);

router.get(
  "/events/:eventId/tables",
  syncHandler((req, res) => {
    const tables = db
      .prepare("SELECT * FROM tables WHERE event_id = ?")
      .all(req.params.eventId) as TableRow[];
    res.json(mapToCamelCase(tables));
  }),
);

router.post(
  "/tables/assign",
  syncHandler((req, res) => {
    const parsed = AssignTableSchema.parse(req.body);
    db.prepare("UPDATE guest_groups SET table_id = ? WHERE id = ?").run(
      parsed.tableId ?? null,
      parsed.guestGroupId,
    );
    res.json({ success: true });
  }),
);

export default router;
