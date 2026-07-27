import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

// Build the absolute origin (scheme://host) for a request so SSR renders
// absolute canonical/og:url. Honors proxy headers since apps run behind ingress.
function requestOrigin(req: express.Request): string {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = req.get("host");
  return host ? `${proto}://${host}` : "";
}

// Flatten a react-helmet-async context into a head-tag string.
function helmetHeadTags(helmetContext: any): string {
  const helmet = helmetContext?.helmet;
  if (!helmet) return "";
  return [
    helmet.title?.toString(),
    helmet.meta?.toString(),
    helmet.link?.toString(),
    helmet.script?.toString(),
  ]
    .filter((tag) => tag && tag.trim())
    .join("\n  ");
}

// Inject SSR head tags into the template, removing any static default tag the
// render already provides so View Source has exactly one of each (no duplicate
// title, description, canonical, or og:/twitter: tags). Static tags the route
// does not override are left as app-wide fallbacks.
function injectHead(template: string, headTags: string): string {
  if (!headTags) return template;
  let html = template;

  if (/<title[\s>]/i.test(headTags)) {
    html = html.replace(/[ \t]*<title\b[^>]*>[\s\S]*?<\/title>\s*\n?/i, "");
  }

  const canonicalInHead = /<link[^>]*rel=["']canonical["']/i.test(headTags);
  if (canonicalInHead) {
    html = html.replace(/[ \t]*<link[^>]*rel=["']canonical["'][^>]*>\s*\n?/i, "");
  }

  const metaKeys = new Set<string>();
  const metaAttrRe = /<meta[^>]*\b(name|property)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = metaAttrRe.exec(headTags)) !== null) {
    metaKeys.add(`${m[1].toLowerCase()}=${m[2].toLowerCase()}`);
  }
  if (metaKeys.size > 0) {
    html = html.replace(/[ \t]*<meta\b[^>]*>\s*\n?/gi, (tag) => {
      const attr = /\b(name|property)=["']([^"']+)["']/i.exec(tag);
      if (attr && metaKeys.has(`${attr[1].toLowerCase()}=${attr[2].toLowerCase()}`)) {
        return "";
      }
      return tag;
    });
  }

  return html.includes("<!--ssr-head-->")
    ? html.replace("<!--ssr-head-->", headTags)
    : html.replace("<head>", `<head>\n  ${headTags}`);
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const resolvedConfig = typeof viteConfig === "function"
    ? viteConfig({ command: "serve", mode: "development", isSsrBuild: false })
    : viteConfig;

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "frontend",
        "index.html"
      );

      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      const ENTRY_SCRIPT = `<script type="module" src="/src/main.tsx"></script>`;
      if (!template.includes(`src="/src/main.tsx"`) && !template.includes(`src='/src/main.tsx'`)) {
        template = template
          .replace(/<script[^>]*src=["'][^"']*main\.[^"']*["'][^>]*><\/script>/gi, "")
          .replace("</body>", `  ${ENTRY_SCRIPT}\n</body>`);
        log("Warning: entry script tag was missing or wrong — auto-restored");
      }

      let page = await vite.transformIndexHtml(url, template);

      // Inject per-route SEO head tags in dev too, so preview View Source
      // matches production. Uses ssrLoadModule so HMR keeps entry-server fresh.
      // Any failure falls back to the plain CSR page — dev must never break.
      try {
        const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
        const { helmetContext } = render(url, requestOrigin(req));
        page = injectHead(page, helmetHeadTags(helmetContext));
      } catch (ssrErr) {
        log(`Dev SSR head injection skipped for ${url}: ${ssrErr}`);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  log("Vite development server setup complete");
}

export async function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const ssrBundlePath = path.resolve(import.meta.dirname, "server/entry-server.js");
  const templatePath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Load SSR bundle at startup; fall back to SPA mode if missing
  type RenderFn = (url: string, origin?: string) => { helmetContext: Record<string, any> };
  let ssrRender: RenderFn | null = null;
  try {
    const mod = await import(ssrBundlePath);
    ssrRender = mod.render as RenderFn;
    log("SSR rendering enabled");
  } catch {
    log("SSR bundle not found, serving in SPA mode");
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  app.use(express.static(distPath));

  app.use("/*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    if (!ssrRender) {
      return res.sendFile(templatePath);
    }

    try {
      const { helmetContext } = ssrRender(req.originalUrl, requestOrigin(req));
      const html = injectHead(template, helmetHeadTags(helmetContext));
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      // SSR failed (e.g. component uses browser globals) — fall back to SPA
      log(`SSR render failed for ${req.originalUrl}: ${e}`);
      res.sendFile(templatePath);
    }
  });

  log("Static file serving setup complete");
}
