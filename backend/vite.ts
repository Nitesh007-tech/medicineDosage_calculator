import path from "path";
import fs from "fs";
import express, { type Express } from "express";
import { type Server } from "http";

const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

export async function serveStatic(app: Express) {
  // In production, built files are in dist/ at the root (after build process)
  const distPublicPath = path.resolve(import.meta.dirname, "../dist/public");
  const distServerPath = path.resolve(import.meta.dirname, "../dist/server");
  const templatePath = path.resolve(distPublicPath, "index.html");

  if (!fs.existsSync(distPublicPath)) {
    log(`⚠️ Frontend build not found: ${distPublicPath}. Skipping static file serving.`);
    return;
  }

  // Load SSR bundle if available
  type RenderFn = (url: string, origin?: string) => { helmetContext: Record<string, any> };
  let ssrRender: RenderFn | null = null;
  
  try {
    const ssrBundlePath = path.resolve(distServerPath, "entry-server.js");
    const mod = await import(ssrBundlePath);
    ssrRender = mod.render as RenderFn;
    log("SSR rendering enabled");
  } catch (err) {
    log(`SSR bundle not available, falling back to SPA mode: ${err}`);
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  // Serve static assets
  app.use(express.static(distPublicPath, { maxAge: "1y" }));

  // Serve SPA with SSR fallback
  app.use("/*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      if (!ssrRender) {
        return res.sendFile(templatePath);
      }

      const requestOrigin = (req: express.Request): string => {
        const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
        const proto = forwardedProto || req.protocol || "https";
        const host = req.get("host");
        return host ? `${proto}://${host}` : "";
      };

      const { helmetContext } = ssrRender(req.originalUrl, requestOrigin(req));
      const headTags = helmetContext?.helmet ? 
        [helmetContext.helmet.title, helmetContext.helmet.meta, helmetContext.helmet.link]
          .filter((tag: any) => tag?.toString?.())
          .join("\n  ") : "";
      
      const html = headTags 
        ? template.replace("</head>", `  ${headTags}\n</head>`)
        : template;
      
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      log(`SSR failed for ${req.originalUrl}, falling back to SPA`);
      res.sendFile(templatePath);
    }
  });

  log("Static file serving setup complete");
}

export { log };
