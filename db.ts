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
