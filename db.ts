import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "guestseat.db");
export const db = new Database(dbPath);

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
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
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
      attendees TEXT NOT NULL,
      group_size INTEGER NOT NULL,
      note TEXT,
      table_id TEXT,
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
    ALTER TABLE invitations ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
  `,
  `
    ALTER TABLE guest_groups ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
  `,
  `
    ALTER TABLE tables ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
  `,
  `
    ALTER TABLE events ADD COLUMN theme TEXT;
  `,
  `
    ALTER TABLE events ADD COLUMN venue_map_url TEXT;
  `,
];

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = db
    .prepare("SELECT version FROM migrations ORDER BY version ASC")
    .all() as Array<{ version: number }>;
  const applied = new Set(appliedRows.map((row) => row.version));

  const insertMigration = db.prepare(
    "INSERT INTO migrations (version, run_at) VALUES (?, CURRENT_TIMESTAMP)",
  );

  migrations.forEach((sql, index) => {
    const version = index + 1;
    if (applied.has(version)) {
      return;
    }

    try {
      db.exec(sql);
      insertMigration.run(version);
      console.log(`Applied migration v${version}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duplicateColumnError = message.includes("duplicate column name");
      const alreadyExistsError = message.includes("already exists");
      if (duplicateColumnError || alreadyExistsError) {
        insertMigration.run(version);
        return;
      }
      throw error;
    }
  });
}
