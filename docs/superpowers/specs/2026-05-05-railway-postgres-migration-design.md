# Design: PostgreSQL Migration + Railway Deployment

**Date:** 2026-05-05  
**Status:** Approved

## Goal

Make GuestSeat deployable on Railway with persistent data by replacing SQLite (better-sqlite3) with PostgreSQL (pg). Railway provisions a managed Postgres instance and injects `DATABASE_URL` automatically.

## Architecture

No structural changes to the application. Express + Vite SPA stays intact. The only layer that changes is the database client and all code that touches it.

- **Database client:** `pg` (node-postgres) Pool connected via `DATABASE_URL`
- **Migrations:** Same version-tracking pattern, rewritten as async `pool.query()` calls
- **Routes:** All handlers become `async/await`; SQL placeholders change from `?` to `$1, $2, ...`
- **Transactions:** SQLite `db.transaction()` blocks become `BEGIN`/`COMMIT` using a dedicated pool client

## Files Changed

| File | Change |
|---|---|
| `db.ts` | Full rewrite — pg Pool, async migrations, `mapToCamelCase` stays |
| `routes/events.ts` | async handlers, `$N` placeholders, dynamic PATCH builder |
| `routes/invitations.ts` | async handlers, `$N` placeholders, transaction block |
| `routes/guests.ts` | async handlers, `$N` placeholders |
| `routes/tables.ts` | async handlers, `$N` placeholders |
| `routes/clients.ts` | async handlers, `$N` placeholders |
| `package.json` | remove `better-sqlite3`, add `pg` + `@types/pg` |
| `.env.example` | document `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM` |

Files **not** changed: `utils.ts`, `types/db.ts`, `server.ts`, `railway.toml`, `vite.config.ts`.

## SQL Dialect Changes

- `?` positional params → `$1, $2, ...`
- `COALESCE(?, col)` patch pattern → dynamic `SET` builder (only include fields that are present in the request body)
- `result.changes === 0` (better-sqlite3) → `result.rowCount === 0` (pg)
- `attendees` column: `TEXT` (JSON string) → `JSONB` (native Postgres JSON); JSON.stringify/parse calls removed in favour of passing objects directly
- `is_active` column: `INTEGER` (0/1) stays as-is in schema; pg returns JS number, so existing `Boolean(client.isActive)` cast remains valid

## Migration System

Same approach as current: a `migrations` table tracks applied version numbers. On startup, `runMigrations()` runs any unapplied migrations in order. The function becomes `async` and uses `pool.query()`.

The existing 13 migrations are consolidated into a clean initial schema (no ALTER TABLE noise), since this is a fresh Postgres database with no existing data to preserve.

## Transaction Blocks

Two places use SQLite transactions:

1. `invitations.ts` — `deleteInvitation`: deletes guest_groups then invitation
2. `invitations.ts` — `saveRsvp`: inserts guest_group then updates invitation status

Both become:
```
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ...queries...
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Auto-injected by Railway Postgres plugin |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `RESEND_FROM` | Verified sender address in Resend |

## Railway Setup Steps (manual, post-deploy)

1. Create a new Railway project and link the repo
2. Add a **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`
3. Set `RESEND_API_KEY` and `RESEND_FROM` in the Railway environment variables panel
4. Deploy — `runMigrations()` runs on startup and creates all tables

## Local Development

Add `DATABASE_URL` to `.env` pointing at a local Postgres instance, or use `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`. The app continues to run with `npm run dev` unchanged.
