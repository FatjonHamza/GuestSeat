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

  const mapped = mapToCamelCase(client) as unknown as Record<string, unknown>;
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
    const mapped = mapToCamelCase(rows) as unknown as Array<Record<string, unknown>>;
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
    res.status(result.status).json(result.body);
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
    res.status(result.status).json(result.body);
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
      res.status(404).json({ error: "Client not found" });
      return;
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
    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ success: true });
  }),
);

export default router;
