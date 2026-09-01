import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";

const app = express();

// Basic middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false, limit: "25mb" }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  let capturedJson: any;
  const originalJson = res.json;

  res.json = function (body, ...args) {
    capturedJson = body;
    return originalJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJson) {
        logLine += ` :: ${JSON.stringify(capturedJson)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Add health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    uptime: process.uptime(),
  });
});

// Initialize server
let httpServer: any = null;
let initPromise: Promise<void> | null = null;

async function initializeServer() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Register API routes
      httpServer = await registerRoutes(app);

      // Error handler (must be last middleware)
      app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error("Request error:", err);
        const status = err.status || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      // Setup static file serving (frontend)
      try {
        await serveStatic(app);
      } catch (serveErr) {
        console.warn("⚠️ Static file serving failed (frontend build missing?):", serveErr);
        // Continue anyway - API routes will still work
        app.use("/*", (req, res) => {
          res.status(503).json({ 
            error: "Frontend unavailable",
            message: "The frontend build files are missing. Please rebuild."
          });
        });
      }

      log("✅ Server initialized successfully");
    } catch (err) {
      console.error("❌ Failed to initialize server:", err);
      throw err;
    }
  })();
  return initPromise;
}

// For local development only
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  initializeServer().then(() => {
    const PORT = process.env.PORT || 3000;
    httpServer?.listen(
      {
        port: PORT,
        host: "0.0.0.0",
      },
      () => {
        log(`🚀 Server running on port ${PORT}`);
      }
    );
  });
}

// Export app for local use
export { app };

// Explicit handler export for Vercel Serverless Functions
export default async function handler(req: Request, res: Response) {
  if (!httpServer) {
    await initializeServer();
  }
  app(req, res);
}
