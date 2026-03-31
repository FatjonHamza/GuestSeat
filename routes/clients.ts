import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, mapToCamelCase } from "../db";
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

function authenticateClient(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  const client = db
    .prepare("SELECT * FROM clients WHERE lower(email) = ?")
    .get(normalizedEmail) as ClientRow | undefined;

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
    return {
      status: 403,
      body: { error: "Aksesi për këtë llogari nuk ka filluar ende." },
    };
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
  syncHandler((_req, res) => {
    const clients = db
      .prepare("SELECT * FROM clients ORDER BY created_at DESC")
      .all() as ClientRow[];

    const mapped = mapToCamelCase(clients) as Array<Record<string, unknown>>;
    const normalized = mapped.map((client) => ({
      ...client,
      isActive: Boolean(client.isActive),
    }));

    res.json(normalized);
  }),
);

router.post(
  "/clients/login",
  syncHandler((req, res) => {
    const parsed = ClientLoginSchema.parse(req.body);
    const result = authenticateClient(parsed.email, parsed.password);
    return res.status(result.status).json(result.body);
  }),
);

router.get(
  "/clients/login",
  syncHandler((req, res) => {
    const parsed = ClientLoginSchema.parse({
      email: req.query.email,
      password: req.query.password,
    });
    const result = authenticateClient(parsed.email, parsed.password);
    return res.status(result.status).json(result.body);
  }),
);

router.get(
  "/clients/analytics",
  syncHandler((_req, res) => {
    const clients = db.prepare("SELECT * FROM clients").all() as ClientRow[];
    const now = new Date();
    const next30 = new Date(now);
    next30.setDate(next30.getDate() + 30);

    const stats = clients.reduce(
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
      { total: clients.length, active: 0, expired: 0, upcoming: 0, expiringSoon: 0 },
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

    db.prepare(
      `
        INSERT INTO clients (id, first_name, last_name, phone, email, password, access_start, access_end, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
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
  syncHandler((req, res) => {
    const parsed = ClientPatchSchema.parse(req.body);
    const existing = db
      .prepare("SELECT * FROM clients WHERE id = ?")
      .get(req.params.id) as ClientRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }

    db.prepare(
      `
        UPDATE clients
        SET first_name = ?,
            last_name = ?,
            phone = ?,
            email = ?,
            access_start = ?,
            access_end = ?,
            is_active = ?
        WHERE id = ?
      `,
    ).run(
      parsed.firstName ?? existing.first_name,
      parsed.lastName ?? existing.last_name,
      parsed.phone ?? existing.phone,
      parsed.email ?? existing.email,
      parsed.accessStart ?? existing.access_start,
      parsed.accessEnd ?? existing.access_end,
      parsed.isActive !== undefined ? (parsed.isActive ? 1 : 0) : existing.is_active,
      req.params.id,
    );

    res.json({ success: true });
  }),
);

router.delete(
  "/clients/:id",
  syncHandler((req, res) => {
    const result = db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ success: true });
  }),
);

export default router;
