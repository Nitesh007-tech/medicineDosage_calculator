var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// backend/server.ts
import "dotenv/config";
import express2 from "express";

// backend/routes.ts
import { createServer } from "http";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  calculations: () => calculations,
  insertCalculationSchema: () => insertCalculationSchema,
  insertUserSchema: () => insertUserSchema,
  users: () => users
});
import { pgTable, text, serial, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var calculations = pgTable("calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id"),
  drugName: text("drug_name").notNull(),
  doseGiven: text("dose_given").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCalculationSchema = createInsertSchema(calculations).pick({
  patientId: true,
  drugName: true,
  doseGiven: true,
  result: true
});

// backend/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// backend/storage.ts
import { desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getAllUsers() {
    const result = await db.select().from(users);
    return result;
  }
  async createUser(user) {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  async getCalculations() {
    return await db.select().from(calculations).orderBy(desc(calculations.createdAt)).limit(50);
  }
  async createCalculation(entry) {
    const [created] = await db.insert(calculations).values(entry).returning();
    return created;
  }
  async clearCalculations() {
    await db.delete(calculations);
  }
};
var storage = new DatabaseStorage();

// backend/upload.route.ts
import { Router } from "express";
import multer from "multer";

// backend/file.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
var AWS_S3_BUCKET = "joylo-storage";
var AWS_REGION = "eu-west-1";
var CDN_BASE = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
var _s3Client = null;
function getS3Client() {
  if (_s3Client) return _s3Client;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set");
  }
  _s3Client = new S3Client({
    region: AWS_REGION,
    credentials: { accessKeyId, secretAccessKey }
  });
  return _s3Client;
}
function getProjectId() {
  const projectId = process.env.JOYLO_PROJECT_ID;
  if (projectId) return projectId;
  const apiUrl = process.env.VITE_API_URL || "";
  const match = apiUrl.match(/https?:\/\/([a-f0-9-]+)-app\.joylo\.(io|dev)/);
  return match ? match[1] : "unknown";
}
var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
var ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
var ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
var MAX_FILE_SIZE = 50 * 1024 * 1024;
function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: images (jpeg, png, gif, webp) and videos (mp4, webm)`
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: 50MB`
    };
  }
  return { valid: true };
}
async function saveFile(file, folder = "media") {
  const projectId = getProjectId();
  const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const key = `generated_projects/${projectId}/uploads/${folder}/${safeName}`;
  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const client = getS3Client();
  try {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read"
    });
    await client.send(command);
    console.log(`Uploaded to AWS S3: ${key}`);
    return {
      url: `${CDN_BASE}/${key}`,
      key,
      type,
      filename: safeName
    };
  } catch (error) {
    console.error("Failed to upload to S3:", error);
    throw new Error("Failed to upload file to storage");
  }
}
async function deleteFile(key) {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key
    });
    await client.send(command);
    console.log(`Deleted from AWS S3: ${key}`);
    return true;
  } catch (error) {
    console.error("Failed to delete from S3:", error);
    return false;
  }
}

// backend/upload.route.ts
var router = Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB
  }
});
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const uploadedFile = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer
    };
    const validation = validateFile(uploadedFile);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const folder = req.query.folder || "media";
    const result = await saveFile(uploadedFile, folder);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});
router.delete("/", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: "No file key provided" });
      return;
    }
    const success = await deleteFile(key);
    if (success) {
      res.json({ success: true, message: "File marked for deletion" });
    } else {
      res.status(500).json({ error: "Failed to mark file for deletion" });
    }
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});
var upload_route_default = router;

// backend/routes.ts
var anthropic = new Anthropic({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL
});
var AI_KEY_PRESENT = !!process.env.LLM_API_KEY;
var DOSE_SYSTEM_PROMPT = `You are a clinical dosing support assistant used by pharmacy staff. You are NOT a replacement for a licensed pharmacist or physician \u2014 every output must be clearly labeled as a suggestion requiring professional verification.

You will receive structured patient data: age, sex, height, weight, BMI, calculated BSA, calculated creatinine clearance, hepatic function status, known comorbidities, allergies, current medications, and (if applicable) planned surgery/procedure. You will also receive the selected drug and standard dosing reference range for that drug.

Your task:
1. Calculate the weight-based or BSA-based dose using standard published formulas (mg/kg or mg/m\xB2) from the reference range provided.
2. Check renal function (CrCl) and hepatic status against known adjustment thresholds for this drug class; if adjustment is needed, state the adjusted dose and explain why in one sentence.
3. Cross-check allergies and comorbidities against contraindications for this drug; if there is a conflict, flag it clearly as a WARNING before giving any dose.
4. If surgery/procedure context is provided, note any relevant timing consideration (e.g. prophylactic antibiotic should be given within 60 minutes pre-incision).
5. Never exceed the standard maximum daily dose provided in the reference data, even if weight-based math would suggest a higher number \u2014 flag this instead of silently capping it.
6. Always end your response with: "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration."

Output format (JSON):
{
  "recommended_dose": "",
  "calculation_basis": "",
  "adjustments_applied": [],
  "warnings": [],
  "disclaimer": "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration."
}

If any required patient data is missing, do not guess \u2014 return a request for the missing field by returning: { "missing_field": "<field name>" } instead of a dose.

Respond with ONLY the JSON object, no markdown fences or extra prose.`;
var dosePayloadSchema = z.object({
  patient: z.record(z.any()),
  metrics: z.record(z.any()),
  drug: z.record(z.any())
});
var DISCLAIMER = "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration.";
function computeLocalDosing(patient, metrics, drug) {
  const weightKg = Number(patient?.weightKg) || 0;
  const heightCm = Number(patient?.heightCm) || 0;
  const age = Number(patient?.age) || 0;
  const serumCr = Number(patient?.serumCr) || 0;
  const crcl = metrics?.crcl !== void 0 && metrics?.crcl !== null ? Number(metrics.crcl) : null;
  const bsa = metrics?.bsa !== void 0 && metrics?.bsa !== null ? Number(metrics.bsa) : null;
  if (!drug) {
    return { missing_field: "drug selection", disclaimer: DISCLAIMER };
  }
  if (!weightKg) return { missing_field: "weight", disclaimer: DISCLAIMER };
  if (!heightCm) return { missing_field: "height", disclaimer: DISCLAIMER };
  if (!age) return { missing_field: "age", disclaimer: DISCLAIMER };
  if (!serumCr)
    return { missing_field: "serum creatinine", disclaimer: DISCLAIMER };
  const adjustments = [];
  const warnings = [];
  const minDose = Number(drug.minDose) || 0;
  const maxDose = Number(drug.maxDose) || 0;
  const mid = (minDose + maxDose) / 2;
  let doseMg = 0;
  let basis = "";
  if (drug.dosingBasis === "mg/kg") {
    doseMg = mid * weightKg;
    basis = `${mid} mg/kg \xD7 ${weightKg} kg = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else if (drug.dosingBasis === "mg/m2") {
    const area = bsa || 0;
    doseMg = mid * area;
    basis = `${mid} mg/m\xB2 \xD7 ${area.toFixed(2)} m\xB2 BSA = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else {
    doseMg = weightKg > 120 ? maxDose : minDose;
    basis = `Fixed dosing ${drug.dosingRange}; selected ${Math.round(
      doseMg
    )} mg based on patient weight`;
  }
  if (crcl !== null && drug.renalThresholdCrCl && crcl < Number(drug.renalThresholdCrCl)) {
    adjustments.push(
      `Renal: CrCl ${crcl.toFixed(0)} mL/min is below the ${drug.renalThresholdCrCl} mL/min threshold. ${drug.renalAdjustment}`
    );
  }
  if (patient?.hepaticImpairment) {
    adjustments.push(
      `Hepatic: patient has hepatic impairment. ${drug.hepaticAdjustment}`
    );
  }
  const patientAllergies = (patient?.allergies || []).map(
    (a) => String(a).toLowerCase()
  );
  const crossReact = (drug.allergyCrossReact || []).map(
    (a) => String(a).toLowerCase()
  );
  const allergyConflict = patientAllergies.some(
    (a) => crossReact.some((c) => c.includes(a) || a.includes(c))
  );
  if (allergyConflict) {
    warnings.push(
      `ALLERGY CONFLICT: patient allergy overlaps with ${drug.name} (${drug.className}). Do NOT administer without verification.`
    );
  }
  const comorbidities = patient?.comorbidities || [];
  const contraindications = drug.contraindications || [];
  const comorbConflict = comorbidities.filter(
    (c) => contraindications.some(
      (ci) => String(ci).toLowerCase().includes(String(c).toLowerCase())
    )
  );
  if (comorbConflict.length > 0) {
    warnings.push(
      `CONTRAINDICATION: comorbidity "${comorbConflict.join(
        ", "
      )}" is a documented contraindication for ${drug.name}.`
    );
  }
  if (patient?.pregnancy === "pregnant" && drug.id === "carboplatin") {
    warnings.push(
      `PREGNANCY: ${drug.name} is teratogenic and contraindicated in pregnancy.`
    );
  }
  if (patient?.surgery && patient.surgery !== "none" && drug.id === "cefazolin") {
    adjustments.push(
      "Surgical prophylaxis: administer within 60 minutes before incision for optimal tissue levels."
    );
  }
  const dailyEstimate = drug.dosingBasis === "fixed" ? doseMg * 3 : doseMg * 2;
  if (drug.maxDailyDose && dailyEstimate > Number(drug.maxDailyDose)) {
    warnings.push(
      `MAX DOSE EXCEEDED: weight-based math (~${Math.round(
        dailyEstimate
      )} mg/day) exceeds the maximum daily dose of ${drug.maxDailyDose} mg. Verify before dosing \u2014 do not silently cap.`
    );
  }
  return {
    recommended_dose: `${Math.round(doseMg)} mg per dose \u2014 ${drug.dosingRange}`,
    calculation_basis: basis,
    adjustments_applied: adjustments,
    warnings,
    disclaimer: DISCLAIMER
  };
}
async function registerRoutes(app2) {
  app2.use("/api/upload", upload_route_default);
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("Error creating users:", error);
      res.status(500).json({ message: "Failed to create user" });
      return;
    }
  });
  app2.get("/api/config", (req, res) => {
    res.json({ aiEnabled: AI_KEY_PRESENT });
  });
  app2.post("/api/dose", async (req, res) => {
    try {
      const { patient, metrics, drug } = dosePayloadSchema.parse(req.body);
      console.log("[dose] request for drug", drug?.name, "aiEnabled:", AI_KEY_PRESENT);
      if (!AI_KEY_PRESENT) {
        const local = computeLocalDosing(patient, metrics, drug);
        console.log("[dose] local (no AI key) result", local);
        res.json({ ...local, ai_powered: false });
        return;
      }
      const userContent = JSON.stringify(
        { patient, calculated_metrics: metrics, drug_reference: drug },
        null,
        2
      );
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          system: DOSE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }]
        });
        const textBlock = message.content.find((b) => b.type === "text");
        let raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
        raw = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(raw);
        console.log("[dose] parsed AI result", parsed);
        res.json({ ...parsed, ai_powered: true });
      } catch (aiError) {
        console.error("[dose] AI call failed, falling back to local engine", aiError);
        const local = computeLocalDosing(patient, metrics, drug);
        res.json({ ...local, ai_powered: false });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("[dose] error", error);
      res.status(500).json({ message: "Failed to compute dose" });
    }
  });
  app2.get("/api/history", async (req, res) => {
    try {
      const entries = await storage.getCalculations();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });
  app2.post("/api/history", async (req, res) => {
    try {
      const validated = insertCalculationSchema.parse(req.body);
      const entry = await storage.createCalculation(validated);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("Error creating history entry:", error);
      res.status(500).json({ message: "Failed to save history" });
    }
  });
  app2.delete("/api/history", async (req, res) => {
    try {
      await storage.clearCalculations();
      res.json({ message: "History cleared" });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ message: "Failed to clear history" });
    }
  });
  app2.get("/sitemap.xml", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const routes = [
      { path: "/", changefreq: "weekly", priority: "1.0" }
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// backend/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "vite-joylo-runtime-overlay";
import joyloEditor from "vite-plugin-joylo-editor";
var vite_config_default = defineConfig(({ isSsrBuild }) => ({
  plugins: isSsrBuild ? [react()] : [joyloEditor(), runtimeErrorOverlay(), react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "frontend/src"),
      "@shared": path.resolve(import.meta.dirname, "shared")
    }
  },
  root: path.resolve(import.meta.dirname, "frontend"),
  build: {
    outDir: isSsrBuild ? path.resolve(import.meta.dirname, "dist/server") : path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
}));

// backend/vite.ts
var viteLogger = createLogger();
function requestOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = req.get("host");
  return host ? `${proto}://${host}` : "";
}
function helmetHeadTags(helmetContext) {
  const helmet = helmetContext?.helmet;
  if (!helmet) return "";
  return [
    helmet.title?.toString(),
    helmet.meta?.toString(),
    helmet.link?.toString(),
    helmet.script?.toString()
  ].filter((tag) => tag && tag.trim()).join("\n  ");
}
function injectHead(template, headTags) {
  if (!headTags) return template;
  let html = template;
  if (/<title[\s>]/i.test(headTags)) {
    html = html.replace(/[ \t]*<title\b[^>]*>[\s\S]*?<\/title>\s*\n?/i, "");
  }
  const canonicalInHead = /<link[^>]*rel=["']canonical["']/i.test(headTags);
  if (canonicalInHead) {
    html = html.replace(/[ \t]*<link[^>]*rel=["']canonical["'][^>]*>\s*\n?/i, "");
  }
  const metaKeys = /* @__PURE__ */ new Set();
  const metaAttrRe = /<meta[^>]*\b(name|property)=["']([^"']+)["']/gi;
  let m;
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
  return html.includes("<!--ssr-head-->") ? html.replace("<!--ssr-head-->", headTags) : html.replace("<head>", `<head>
  ${headTags}`);
}
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const resolvedConfig = typeof vite_config_default === "function" ? vite_config_default({ command: "serve", mode: "development", isSsrBuild: false }) : vite_config_default;
  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("/*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "frontend",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const ENTRY_SCRIPT = `<script type="module" src="/src/main.tsx"></script>`;
      if (!template.includes(`src="/src/main.tsx"`) && !template.includes(`src='/src/main.tsx'`)) {
        template = template.replace(/<script[^>]*src=["'][^"']*main\.[^"']*["'][^>]*><\/script>/gi, "").replace("</body>", `  ${ENTRY_SCRIPT}
</body>`);
        log("Warning: entry script tag was missing or wrong \u2014 auto-restored");
      }
      let page = await vite.transformIndexHtml(url, template);
      try {
        const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
        const { helmetContext } = render(url, requestOrigin(req));
        page = injectHead(page, helmetHeadTags(helmetContext));
      } catch (ssrErr) {
        log(`Dev SSR head injection skipped for ${url}: ${ssrErr}`);
      }
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  log("Vite development server setup complete");
}
async function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  const ssrBundlePath = path2.resolve(import.meta.dirname, "server/entry-server.js");
  const templatePath = path2.resolve(distPath, "index.html");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  let ssrRender = null;
  try {
    const mod = await import(ssrBundlePath);
    ssrRender = mod.render;
    log("SSR rendering enabled");
  } catch {
    log("SSR bundle not found, serving in SPA mode");
  }
  const template = fs.readFileSync(templatePath, "utf-8");
  app2.use(express.static(distPath));
  app2.use("/*", async (req, res, next) => {
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
      log(`SSR render failed for ${req.originalUrl}: ${e}`);
      res.sendFile(templatePath);
    }
  });
  log("Static file serving setup complete");
}

// backend/server.ts
var app = express2();
app.use(express2.json({ limit: "25mb" }));
app.use(express2.urlencoded({ extended: false, limit: "25mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJson;
  const originalJson = res.json;
  res.json = function(body, ...args) {
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
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0"
  });
});
async function startServer() {
  try {
    const server = await registerRoutes(app);
    app.use((err, req, res, next) => {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    const nodeEnv = process.env.NODE_ENV || app.get("env");
    if (nodeEnv === "production") {
      await serveStatic(app);
    } else if (nodeEnv === "development") {
      await setupVite(app, server);
    } else {
      await serveStatic(app);
    }
    const PORT = process.env.PORT || 3e3;
    if (!process.env.PORT) {
      console.log("\u26A0\uFE0F  .env not loaded or PORT not set");
    }
    server.listen(
      {
        port: PORT,
        host: "0.0.0.0",
        reusePort: true
      },
      () => {
        log(`\u{1F680} Joylo fullstack app running on port ${PORT}`);
        log(`Environment: ${nodeEnv}`);
        if (nodeEnv === "development") {
          log("Frontend served via Vite dev server");
        } else {
          log("Frontend served as static files");
        }
      }
    );
  } catch (err) {
    console.error("\u274C Failed to start server:", err);
    process.exit(1);
  }
}
startServer();
