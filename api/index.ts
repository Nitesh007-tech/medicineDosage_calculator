import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "../backend/routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false, limit: "25mb" }));

// Health check — always available, even before full init
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    uptime: process.uptime(),
  });
});

// ---------------------------------------------------------------------------
// Lazy initialization: register routes once, even under concurrent cold starts.
// registerRoutes() is async (it creates an http.Server internally) so we must
// await it before handing off requests. The promise is module-level so every
// concurrent request on a cold start waits for the same init rather than
// triggering duplicate registration.
// ---------------------------------------------------------------------------
let initPromise: Promise<void> | null = null;
let routesRegistered = false;

function ensureInitialized(): Promise<void> {
  if (routesRegistered) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await registerRoutes(app);

    // Error handler MUST come after all routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[api] error:", err);
      const status = (err as any).status || 500;
      const message = (err as any).message || "Internal Server Error";
      res.status(status).json({ message });
    });

    routesRegistered = true;
  })();

  return initPromise;
}

// ---------------------------------------------------------------------------
// Default export — the handler Vercel @vercel/node expects.
// Vercel calls this function for every incoming request to /api/*
// ---------------------------------------------------------------------------
export default async function handler(req: Request, res: Response) {
  try {
    await ensureInitialized();
    app(req, res);
  } catch (err) {
    console.error("[api] initialization failed:", err);
    res.status(500).json({ message: "Server initialization failed" });
  }
}
