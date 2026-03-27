import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ZodError } from "zod";
import eventsRouter from "./routes/events";
import invitationsRouter from "./routes/invitations";
import guestsRouter from "./routes/guests";
import tablesRouter from "./routes/tables";
import { runMigrations } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  runMigrations();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.use("/api/events", eventsRouter);
  app.use("/api", invitationsRouter);
  app.use("/api", guestsRouter);
  app.use("/api", tablesRouter);

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: err.flatten(),
      });
    }

    const status = 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error(`[API ERROR] ${req.method} ${req.path}:`, err);
    return res.status(status).json({ error: message });
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
