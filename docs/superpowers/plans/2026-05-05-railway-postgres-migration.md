# Railway + PostgreSQL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace better-sqlite3 with pg (node-postgres) so GuestSeat can be deployed on Railway with persistent data via a managed PostgreSQL instance.

**Architecture:** Express + Vite SPA stays unchanged. `db.ts` is fully rewritten to export a `pg` Pool. All five route files are updated to `async/await` with `$N` placeholders. Migrations consolidate the existing 13 SQLite migrations into a clean Postgres schema.

**Tech Stack:** `pg` (node-postgres), `@types/pg`, Railway PostgreSQL plugin, `DATABASE_URL` env var.

---

## File Map

| File | Action |
|---|---|
| `package.json` | Remove `better-sqlite3`, add `pg` + `@types/pg` |
| `db.ts` | Full rewrite — pg Pool + async migrations |
| `routes/events.ts` | async handlers, `$N` placeholders, dynamic PATCH |
| `routes/invitations.ts` | async handlers, `$N` placeholders, transaction blocks |
| `routes/guests.ts` | async handlers, `$N` placeholders |
| `routes/tables.ts` | async handlers, `$N` placeholders |
| `routes/clients.ts` | async handlers, `$N` placeholders |
| `.env.example` | Add `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM` |

---

### Task 1: Install pg, remove better-sqlite3

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pg and types, uninstall better-sqlite3**

```bash
npm uninstall better-sqlite3
npm install pg
npm install --save-dev @types/pg
```

- [ ] **Step 2: Verify package.json has pg and no better-sqlite3**

Open `package.json` and confirm:
- `"pg"` appears in `dependencies`
- `"@types/pg"` appears in `devDependencies`
- `"better-sqlite3"` is gone from both sections

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap better-sqlite3 for pg"
```

---

### Task 2: Rewrite db.ts for PostgreSQL

**Files:**
- Modify: `db.ts`

This task replaces the entire file. The `mapToCamelCase` utility is kept unchanged. The Pool is exported so routes can import and use it. Migrations are consolidated into one clean schema (no ALTER TABLE statements needed since this is a fresh Postgres DB).

- [ ] **Step 1: Rewrite db.ts**

Replace the entire contents of `db.ts` with:

```typescript
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export function mapToCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => mapToCamelCase(item)) as T;
  }

  if (value && typeof value === "object") {
    const mapped = Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, val]) => {
        const camelKey = key.replace(/_([a-z])/g, (_, char: string) =>
          char.toUpperCase(),
        );
        acc[camelKey] = mapToCamelCase(val);
        return acc;
      },
      {} as Record<string, unknown>,
    );
    return mapped as T;
  }

  return value;
}

const migrations: string[] = [
  `
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bride_name TEXT,
      closing_message TEXT,
      date TEXT NOT NULL,
      time TEXT,
      invitation_headline TEXT,
      venue_name TEXT NOT NULL,
      venue_address TEXT,
      venue_map_url TEXT,
      message TEXT,
      rsvp_deadline TEXT,
      theme TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      invitee_name TEXT NOT NULL,
      email TEXT,
      allowed_guests INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'Draft',
      sent_at TEXT,
      responded_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS guest_groups (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      invitation_id TEXT,
      attendees JSONB NOT NULL,
      group_size INTEGER NOT NULL,
      note TEXT,
      table_id TEXT,
      arrived_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (invitation_id) REFERENCES invitations(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      access_start TEXT NOT NULL,
      access_end TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `,
];

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const { rows } = await pool.query<{ version: number }>(
    "SELECT version FROM migrations ORDER BY version ASC",
  );
  const applied = new Set(rows.map((row) => row.version));

  for (let i = 0; i < migrations.length; i++) {
    const version = i + 1;
    if (applied.has(version)) continue;

    try {
      await pool.query(migrations[i]);
      await pool.query(
        "INSERT INTO migrations (version, run_at) VALUES ($1, CURRENT_TIMESTAMP)",
        [version],
      );
      console.log(`Applied migration v${version}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        await pool.query(
          "INSERT INTO migrations (version, run_at) VALUES ($1, CURRENT_TIMESTAMP)",
          [version],
        );
        continue;
      }
      throw error;
    }
  }
}
```

- [ ] **Step 2: Update server.ts to await runMigrations**

Open `server.ts`. Change line 18 from:
```typescript
  runMigrations();
```
to:
```typescript
  await runMigrations();
```

- [ ] **Step 3: Commit**

```bash
git add db.ts server.ts
git commit -m "feat: rewrite db.ts with pg Pool and async migrations"
```

---

### Task 3: Rewrite routes/events.ts

**Files:**
- Modify: `routes/events.ts`

Key changes: import `pool` instead of `db`, all handlers `async`, `?` → `$N`, dynamic PATCH builder replaces `COALESCE(?, col)`.

- [ ] **Step 1: Replace routes/events.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add routes/events.ts
git commit -m "feat: migrate events route to pg"
```

---

### Task 4: Rewrite routes/invitations.ts

**Files:**
- Modify: `routes/invitations.ts`

Two transaction blocks replace `db.transaction()`. The `attendees` column is now JSONB so no `JSON.stringify`/`JSON.parse` needed when writing — but pg returns JSONB as a JS object, so reading is also direct.

- [ ] **Step 1: Replace routes/invitations.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add routes/invitations.ts
git commit -m "feat: migrate invitations route to pg"
```

---

### Task 5: Rewrite routes/guests.ts

**Files:**
- Modify: `routes/guests.ts`

`attendees` is JSONB in Postgres — pg returns it as a JS array automatically, so no `JSON.parse` needed on read. On write, pass the array directly (pg serialises JSONB).

- [ ] **Step 1: Replace routes/guests.ts**

```typescript
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
      return res.status(404).json({ error: "Guest group not found" });
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
    if (rowCount === 0) {
      return res.status(404).json({ error: "Guest group not found" });
    }
    res.json({ success: true });
  }),
);

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add routes/guests.ts
git commit -m "feat: migrate guests route to pg"
```

---

### Task 6: Rewrite routes/tables.ts

**Files:**
- Modify: `routes/tables.ts`

- [ ] **Step 1: Replace routes/tables.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add routes/tables.ts
git commit -m "feat: migrate tables route to pg"
```

---

### Task 7: Rewrite routes/clients.ts

**Files:**
- Modify: `routes/clients.ts`

`authenticateClient` becomes an async function. `result.changes` → `rowCount`.

- [ ] **Step 1: Replace routes/clients.ts**

```typescript
import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { pool, mapToCamelCase } from "../db";
import { syncHandler } from "../utils";
import type { ClientRow } from "../types/db";
import { sendClientCredentialsEmail } from "../utils/mailer";

const router = Router();

const ClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  accessStart: z.string().min(1),
  accessEnd: z.string().min(1),
  isActive: z.boolean().optional(),
});

const ClientPatchSchema = ClientSchema.partial();
const ClientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function authenticateClient(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  const { rows } = await pool.query<ClientRow>(
    "SELECT * FROM clients WHERE lower(email) = $1",
    [normalizedEmail],
  );
  const client = rows[0];

  if (!client) {
    return { status: 401, body: { error: "Ky përdorues nuk ekziston." } };
  }

  if (!client.password || client.password !== password) {
    return { status: 401, body: { error: "Email ose fjalëkalim i pavlefshëm." } };
  }

  if (client.is_active !== 1) {
    return { status: 403, body: { error: "Kjo llogari është jo aktive." } };
  }

  const accessStart = new Date(client.access_start);
  const accessEnd = new Date(client.access_end);
  if (Number.isNaN(accessStart.getTime()) || Number.isNaN(accessEnd.getTime())) {
    return { status: 500, body: { error: "Afati i aksesit është i pavlefshëm." } };
  }

  if (now < accessStart) {
    return { status: 403, body: { error: "Aksesi për këtë llogari nuk ka filluar ende." } };
  }

  if (now > accessEnd) {
    return { status: 403, body: { error: "Aksesi për këtë llogari ka skaduar." } };
  }

  const mapped = mapToCamelCase(client) as Record<string, unknown>;
  delete mapped.password;
  return { status: 200, body: mapped };
}

function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

router.get(
  "/clients",
  syncHandler(async (_req, res) => {
    const { rows } = await pool.query<ClientRow>(
      "SELECT * FROM clients ORDER BY created_at DESC",
    );
    const mapped = mapToCamelCase(rows) as Array<Record<string, unknown>>;
    const normalized = mapped.map((client) => ({
      ...client,
      isActive: Boolean(client.isActive),
    }));
    res.json(normalized);
  }),
);

router.post(
  "/clients/login",
  syncHandler(async (req, res) => {
    const parsed = ClientLoginSchema.parse(req.body);
    const result = await authenticateClient(parsed.email, parsed.password);
    return res.status(result.status).json(result.body);
  }),
);

router.get(
  "/clients/login",
  syncHandler(async (req, res) => {
    const parsed = ClientLoginSchema.parse({
      email: req.query.email,
      password: req.query.password,
    });
    const result = await authenticateClient(parsed.email, parsed.password);
    return res.status(result.status).json(result.body);
  }),
);

router.get(
  "/clients/analytics",
  syncHandler(async (_req, res) => {
    const { rows } = await pool.query<ClientRow>("SELECT * FROM clients");
    const now = new Date();
    const next30 = new Date(now);
    next30.setDate(next30.getDate() + 30);

    const stats = rows.reduce(
      (acc, client) => {
        const endDate = new Date(client.access_end);
        const startDate = new Date(client.access_start);
        const isExpired = endDate < now;
        const isActiveRange = startDate <= now && endDate >= now;

        if (isExpired) acc.expired += 1;
        if (isActiveRange && client.is_active === 1) acc.active += 1;
        if (startDate > now) acc.upcoming += 1;
        if (endDate >= now && endDate <= next30) acc.expiringSoon += 1;

        return acc;
      },
      { total: rows.length, active: 0, expired: 0, upcoming: 0, expiringSoon: 0 },
    );

    res.json(stats);
  }),
);

router.post(
  "/clients",
  syncHandler(async (req, res) => {
    const parsed = ClientSchema.parse(req.body);
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const generatedPassword = generateTempPassword();

    await pool.query(
      `INSERT INTO clients (id, first_name, last_name, phone, email, password, access_start, access_end, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        parsed.firstName,
        parsed.lastName,
        parsed.phone,
        parsed.email,
        generatedPassword,
        parsed.accessStart,
        parsed.accessEnd,
        parsed.isActive === false ? 0 : 1,
        createdAt,
      ],
    );

    let emailSent = false;
    try {
      emailSent = await sendClientCredentialsEmail({
        to: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        password: generatedPassword,
        accessStart: parsed.accessStart,
        accessEnd: parsed.accessEnd,
      });
    } catch (error) {
      console.error("Failed to send client credentials email:", error);
    }

    res.json({
      id,
      success: true,
      emailSent,
      message: emailSent
        ? "Klienti u krijua dhe emaili u dërgua."
        : "Klienti u krijua, por emaili nuk u dërgua. Kontrollo konfigurimin e Resend.",
    });
  }),
);

router.patch(
  "/clients/:id",
  syncHandler(async (req, res) => {
    const parsed = ClientPatchSchema.parse(req.body);
    const { rows } = await pool.query<ClientRow>(
      "SELECT * FROM clients WHERE id = $1",
      [req.params.id],
    );
    const existing = rows[0];

    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }

    await pool.query(
      `UPDATE clients
       SET first_name = $1, last_name = $2, phone = $3, email = $4,
           access_start = $5, access_end = $6, is_active = $7
       WHERE id = $8`,
      [
        parsed.firstName ?? existing.first_name,
        parsed.lastName ?? existing.last_name,
        parsed.phone ?? existing.phone,
        parsed.email ?? existing.email,
        parsed.accessStart ?? existing.access_start,
        parsed.accessEnd ?? existing.access_end,
        parsed.isActive !== undefined ? (parsed.isActive ? 1 : 0) : existing.is_active,
        req.params.id,
      ],
    );

    res.json({ success: true });
  }),
);

router.delete(
  "/clients/:id",
  syncHandler(async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM clients WHERE id = $1",
      [req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ success: true });
  }),
);

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add routes/clients.ts
git commit -m "feat: migrate clients route to pg"
```

---

### Task 8: Add .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# PostgreSQL connection string — auto-injected by Railway, or set manually for local dev
# Local example: postgres://postgres:postgres@localhost:5432/guestseat
DATABASE_URL=

# Resend API key for sending emails (https://resend.com)
RESEND_API_KEY=

# Verified sender address in your Resend account
RESEND_FROM=
```

- [ ] **Step 2: Verify .env is still gitignored**

Open `.gitignore` and confirm it contains `.env*` (or at least `.env`). The `.env` file with real keys must never be committed.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example for Railway setup"
```

---

### Task 9: Verify TypeScript compiles cleanly

**Files:** None changed — this is a verification step.

- [ ] **Step 1: Run the TypeScript check**

```bash
npm run lint
```

Expected output: no errors. If there are errors, fix them before proceeding. Common issues:
- `pool` imported but `db` still referenced somewhere — replace with `pool`
- `rowCount` may be `number | null` in some pg versions — use `(rowCount ?? 0) === 0` if needed

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors after pg migration"
```

---

### Task 10: Test locally with a Postgres database

**Files:** None changed — this is a verification step.

- [ ] **Step 1: Start a local Postgres instance**

```bash
docker run --name guestseat-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=guestseat -p 5432:5432 -d postgres
```

- [ ] **Step 2: Set DATABASE_URL in .env**

Add this line to `.env` (don't commit it):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/guestseat
```

- [ ] **Step 3: Start the dev server**

```bash
npm run dev
```

Expected output includes:
```
Applied migration v1
Applied migration v2
...
Applied migration v6
Server running on http://localhost:3000
```

- [ ] **Step 4: Smoke test the API**

```bash
# Create an event
curl -s -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","date":"2026-06-01","venueName":"Test Venue"}' | jq .

# List events
curl -s http://localhost:3000/api/events | jq .
```

Expected: the POST returns `{"id":"...","name":"Test Event",...}` and the GET returns an array with that event.

- [ ] **Step 5: Open the app in a browser**

Navigate to `http://localhost:3000`. Create an event, add guests, check that data persists across page refreshes.
