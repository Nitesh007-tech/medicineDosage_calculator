import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";

// Initialize app
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

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
  });
});

// Initialize middleware once
let middlewareInitialized = false;

async function initializeMiddleware() {
  if (middlewareInitialized) return;
  
  try {
    // Register routes
    await registerRoutes(app);

    // Error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Static serving
    try {
      await serveStatic(app);
    } catch (err) {
      console.warn("Static serving setup failed:", err);
      app.use("/*", (req, res) => {
        res.status(503).json({ error: "Frontend unavailable" });
      });
    }

    middlewareInitialized = true;
    log("✅ Middleware initialized");
  } catch (err) {
    console.error("❌ Failed to initialize middleware:", err);
    throw err;
  }
}

// Local development server
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  initializeMiddleware().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Development server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to start dev server:", err);
    process.exit(1);
  });
}

// Vercel Serverless Handler - CRITICAL
export default async (req: Request, res: Response) => {
  try {
    await initializeMiddleware();
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
