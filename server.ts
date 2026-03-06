import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("guestseat.db");

// Initialize Database
db.exec(`
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

  CREATE TABLE IF NOT EXISTS guest_groups (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    invitation_id TEXT,
    attendees TEXT NOT NULL, -- JSON array
    group_size INTEGER NOT NULL,
    note TEXT,
    table_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
  );

  CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`);

// Migration: Add created_at if missing (for existing databases)
const tablesToMigrate = ['invitations', 'guest_groups', 'tables'];
tablesToMigrate.forEach(tableName => {
  const info = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
  const hasCreatedAt = info.some(col => col.name === 'created_at');
  if (!hasCreatedAt) {
    try {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`).run();
      console.log(`Migrated ${tableName}: added created_at`);
    } catch (e) {
      console.error(`Failed to migrate ${tableName}:`, e);
    }
  }
});

// Migration: Add theme to events if missing
const eventInfo = db.prepare(`PRAGMA table_info(events)`).all() as any[];
const hasTheme = eventInfo.some(col => col.name === 'theme');
if (!hasTheme) {
  try {
    db.prepare(`ALTER TABLE events ADD COLUMN theme TEXT`).run();
    console.log(`Migrated events: added theme`);
  } catch (e) {
    console.error(`Failed to migrate events:`, e);
  }
}

// Migration: Add venue_map_url to events if missing
const hasVenueMapUrl = eventInfo.some(col => col.name === 'venue_map_url');
if (!hasVenueMapUrl) {
  try {
    db.prepare(`ALTER TABLE events ADD COLUMN venue_map_url TEXT`).run();
    console.log(`Migrated events: added venue_map_url`);
  } catch (e) {
    console.error(`Failed to migrate events:`, e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Events
  app.post("/api/events", (req, res) => {
    try {
      const { name, date, time, venueName, venue_name, venueAddress, venue_address, venueMapUrl, venue_map_url, message, rsvpDeadline, rsvp_deadline, theme } = req.body;
      
      const vName = venueName || venue_name;
      const vAddress = venueAddress || venue_address;
      const vMapUrl = venueMapUrl || venue_map_url;
      const rDeadline = rsvpDeadline || rsvp_deadline;

      if (!name || !date || !vName) {
        return res.status(400).json({ error: "Missing required fields: name, date, and venueName are required." });
      }

      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO events (id, name, date, time, venue_name, venue_address, venue_map_url, message, rsvp_deadline, theme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, name, date, time || null, vName, vAddress || null, vMapUrl || null, message || null, rDeadline || null, theme || 'default');
      res.json({ id, name, date, venueName: vName, theme: theme || 'default' });
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/events", (req, res) => {
    try {
      const events = db.prepare("SELECT * FROM events").all();
      // Map database snake_case to frontend camelCase
      const mappedEvents = events.map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        time: e.time,
        venueName: e.venue_name,
        venueAddress: e.venue_address,
        venueMapUrl: e.venue_map_url,
        message: e.message,
        rsvpDeadline: e.rsvp_deadline,
        theme: e.theme
      }));
      res.json(mappedEvents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:id", (req, res) => {
    try {
      const e = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id) as any;
      if (!e) return res.status(404).json({ error: "Event not found" });
      res.json({
        id: e.id,
        name: e.name,
        date: e.date,
        time: e.time,
        venueName: e.venue_name,
        venueAddress: e.venue_address,
        venueMapUrl: e.venue_map_url,
        message: e.message,
        rsvpDeadline: e.rsvp_deadline,
        theme: e.theme
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/events/:id", (req, res) => {
    try {
      const { name, date, time, venueName, venueAddress, venueMapUrl, message, rsvpDeadline, theme } = req.body;
      const id = req.params.id;
      
      const stmt = db.prepare(`
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
      `);
      stmt.run(
        name !== undefined ? name : null, 
        date !== undefined ? date : null, 
        time !== undefined ? time : null, 
        venueName !== undefined ? venueName : null, 
        venueAddress !== undefined ? venueAddress : null, 
        venueMapUrl !== undefined ? venueMapUrl : null, 
        message !== undefined ? message : null, 
        rsvpDeadline !== undefined ? rsvpDeadline : null, 
        theme !== undefined ? theme : null,
        id
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invitations
  app.post("/api/invitations", (req, res) => {
    try {
      const { eventId, event_id, inviteeName, invitee_name, allowedGuests, allowed_guests, email } = req.body;
      const eId = eventId || event_id;
      const iName = inviteeName || invitee_name;
      const aGuests = allowedGuests !== undefined ? allowedGuests : allowed_guests;

      if (!eId || !iName || aGuests === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const token = uuidv4().split('-')[0]; // Simple token
      const stmt = db.prepare(`
        INSERT INTO invitations (id, event_id, invitee_name, email, allowed_guests, token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const createdAt = new Date().toISOString();
      stmt.run(id, eId, iName, email || null, aGuests, token, createdAt);
      res.json({ id, token, inviteeName: iName, createdAt });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:eventId/invitations", (req, res) => {
    try {
      const invitations = db.prepare("SELECT * FROM invitations WHERE event_id = ?").all(req.params.eventId);
      const mapped = invitations.map((i: any) => ({
        id: i.id,
        eventId: i.event_id,
        inviteeName: i.invitee_name,
        email: i.email,
        allowedGuests: i.allowed_guests,
        token: i.token,
        status: i.status,
        sentAt: i.sent_at,
        respondedAt: i.responded_at,
        createdAt: i.created_at
      }));
      res.json(mapped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rsvp/:token", (req, res) => {
    try {
      const i = db.prepare(`
        SELECT i.*, e.name as event_name, e.date as event_date, e.venue_name, e.venue_address, e.message
        FROM invitations i
        JOIN events e ON i.event_id = e.id
        WHERE i.token = ?
      `).get(req.params.token) as any;
      
      if (!i) return res.status(404).json({ error: "Invitation not found" });
      
      res.json({
        id: i.id,
        eventId: i.event_id,
        inviteeName: i.invitee_name,
        email: i.email,
        allowedGuests: i.allowed_guests,
        token: i.token,
        status: i.status,
        sentAt: i.sent_at,
        respondedAt: i.responded_at,
        createdAt: i.created_at,
        name: i.event_name,
        date: i.event_date,
        venueName: i.venue_name,
        venueAddress: i.venue_address,
        message: i.message
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RSVP Submission
  app.post("/api/rsvp", (req, res) => {
    try {
      const { token, attendees, note, attendance } = req.body;
      
      const invitation = db.prepare("SELECT * FROM invitations WHERE token = ?").get(token) as any;
      if (!invitation) return res.status(404).json({ error: "Invitation not found" });

      if (attendance === 'No') {
        db.prepare("UPDATE invitations SET status = 'Responded', responded_at = ? WHERE id = ?")
          .run(new Date().toISOString(), invitation.id);
        return res.json({ success: true, message: "RSVP received" });
      }

      const guestGroupId = uuidv4();
      const groupSize = attendees.length;

      // Start transaction
      const transaction = db.transaction(() => {
        const createdAt = new Date().toISOString();
        // Create Guest Group
        db.prepare(`
          INSERT INTO guest_groups (id, event_id, invitation_id, attendees, group_size, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(guestGroupId, invitation.event_id, invitation.id, JSON.stringify(attendees), groupSize, note || null, createdAt);

        // Update Invitation Status
        db.prepare("UPDATE invitations SET status = 'Responded', responded_at = ? WHERE id = ?")
          .run(createdAt, invitation.id);
      });

      transaction();
      res.json({ success: true, guestGroupId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Guest Groups
  app.post("/api/guests", (req, res) => {
    try {
      const { eventId, attendees, note, tableId } = req.body;
      if (!eventId || !attendees || !Array.isArray(attendees)) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const id = uuidv4();
      const groupSize = attendees.length;
      const createdAt = new Date().toISOString();
      db.prepare(`
        INSERT INTO guest_groups (id, event_id, attendees, group_size, note, table_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, eventId, JSON.stringify(attendees), groupSize, note || null, tableId || null, createdAt);
      res.json({ id, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:eventId/guests", (req, res) => {
    try {
      const guests = db.prepare("SELECT * FROM guest_groups WHERE event_id = ?").all(req.params.eventId);
      // Parse attendees JSON and map fields
      const parsedGuests = guests.map((g: any) => ({
        id: g.id,
        eventId: g.event_id,
        invitationId: g.invitation_id,
        attendees: JSON.parse(g.attendees as string),
        groupSize: g.group_size,
        note: g.note,
        tableId: g.table_id,
        createdAt: g.created_at
      }));
      res.json(parsedGuests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/guests/:id", (req, res) => {
    try {
      const id = req.params.id;
      const { attendees, note, tableId } = req.body;
      const existing = db.prepare("SELECT * FROM guest_groups WHERE id = ?").get(id) as any;
      if (!existing) return res.status(404).json({ error: "Guest group not found" });
      const newAttendees = attendees !== undefined && Array.isArray(attendees) ? JSON.stringify(attendees) : existing.attendees;
      const newGroupSize = attendees !== undefined && Array.isArray(attendees) ? attendees.length : existing.group_size;
      const newNote = note !== undefined ? note : existing.note;
      const newTableId = tableId !== undefined ? tableId : existing.table_id;
      db.prepare("UPDATE guest_groups SET attendees = ?, group_size = ?, note = ?, table_id = ? WHERE id = ?")
        .run(newAttendees, newGroupSize, newNote ?? null, newTableId || null, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guests/:id", (req, res) => {
    try {
      const id = req.params.id;
      const result = db.prepare("DELETE FROM guest_groups WHERE id = ?").run(id);
      if (result.changes === 0) return res.status(404).json({ error: "Guest group not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tables
  app.post("/api/tables", (req, res) => {
    try {
      const { eventId, event_id, name, capacity } = req.body;
      const eId = eventId || event_id;

      if (!eId || !name || !capacity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = uuidv4();
      const createdAt = new Date().toISOString();
      db.prepare("INSERT INTO tables (id, event_id, name, capacity, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(id, eId, name, capacity, createdAt);
      res.json({ id, name, capacity, eventId: eId, createdAt });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:eventId/tables", (req, res) => {
    try {
      const tables = db.prepare("SELECT * FROM tables WHERE event_id = ?").all(req.params.eventId);
      const mapped = tables.map((t: any) => ({
        id: t.id,
        eventId: t.event_id,
        name: t.name,
        capacity: t.capacity,
        createdAt: t.created_at
      }));
      res.json(mapped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tables/assign", (req, res) => {
    const { guestGroupId, tableId } = req.body;
    db.prepare("UPDATE guest_groups SET table_id = ? WHERE id = ?")
      .run(tableId || null, guestGroupId);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
