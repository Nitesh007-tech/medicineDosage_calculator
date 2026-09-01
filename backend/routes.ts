import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

import { insertUserSchema, insertCalculationSchema } from "@shared/schema";
import { storage } from "./storage";
import uploadRoutes from "./upload.route";

const anthropic = new Anthropic({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

// Whether an AI key is actually configured. When false we fall back to a
// deterministic local rules engine so the app still produces a result.
const AI_KEY_PRESENT = !!process.env.LLM_API_KEY;

const DOSE_SYSTEM_PROMPT = `You are a clinical dosing support assistant used by pharmacy staff. You are NOT a replacement for a licensed pharmacist or physician — every output must be clearly labeled as a suggestion requiring professional verification.

You will receive structured patient data: age, sex, height, weight, BMI, calculated BSA, calculated creatinine clearance, hepatic function status, known comorbidities, allergies, current medications, and (if applicable) planned surgery/procedure. You will also receive the selected drug and standard dosing reference range for that drug.

Your task:
1. Calculate the weight-based or BSA-based dose using standard published formulas (mg/kg or mg/m²) from the reference range provided.
2. Check renal function (CrCl) and hepatic status against known adjustment thresholds for this drug class; if adjustment is needed, state the adjusted dose and explain why in one sentence.
3. Cross-check allergies and comorbidities against contraindications for this drug; if there is a conflict, flag it clearly as a WARNING before giving any dose.
4. If surgery/procedure context is provided, note any relevant timing consideration (e.g. prophylactic antibiotic should be given within 60 minutes pre-incision).
5. Never exceed the standard maximum daily dose provided in the reference data, even if weight-based math would suggest a higher number — flag this instead of silently capping it.
6. Always end your response with: "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration."

Output format (JSON):
{
  "recommended_dose": "",
  "calculation_basis": "",
  "adjustments_applied": [],
  "warnings": [],
  "disclaimer": "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration."
}

If any required patient data is missing, do not guess — return a request for the missing field by returning: { "missing_field": "<field name>" } instead of a dose.

Respond with ONLY the JSON object, no markdown fences or extra prose.`;

const dosePayloadSchema = z.object({
  patient: z.record(z.any()),
  metrics: z.record(z.any()),
  drug: z.record(z.any()),
});

const DISCLAIMER =
  "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration.";

// Deterministic local rules engine used when no AI key is configured.
// Mirrors the clinical logic so the app always produces a usable result.
function computeLocalDosing(patient: any, metrics: any, drug: any) {
  const weightKg = Number(patient?.weightKg) || 0;
  const heightCm = Number(patient?.heightCm) || 0;
  const age = Number(patient?.age) || 0;
  const serumCr = Number(patient?.serumCr) || 0;
  const crcl =
    metrics?.crcl !== undefined && metrics?.crcl !== null
      ? Number(metrics.crcl)
      : null;
  const bsa =
    metrics?.bsa !== undefined && metrics?.bsa !== null
      ? Number(metrics.bsa)
      : null;

  if (!drug) {
    return { missing_field: "drug selection", disclaimer: DISCLAIMER };
  }
  if (!weightKg) return { missing_field: "weight", disclaimer: DISCLAIMER };
  if (!heightCm) return { missing_field: "height", disclaimer: DISCLAIMER };
  if (!age) return { missing_field: "age", disclaimer: DISCLAIMER };
  if (!serumCr)
    return { missing_field: "serum creatinine", disclaimer: DISCLAIMER };

  const adjustments: string[] = [];
  const warnings: string[] = [];

  const minDose = Number(drug.minDose) || 0;
  const maxDose = Number(drug.maxDose) || 0;
  const mid = (minDose + maxDose) / 2;

  let doseMg = 0;
  let basis = "";
  if (drug.dosingBasis === "mg/kg") {
    doseMg = mid * weightKg;
    basis = `${mid} mg/kg × ${weightKg} kg = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else if (drug.dosingBasis === "mg/m2") {
    const area = bsa || 0;
    doseMg = mid * area;
    basis = `${mid} mg/m² × ${area.toFixed(2)} m² BSA = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else {
    doseMg = weightKg > 120 ? maxDose : minDose;
    basis = `Fixed dosing ${drug.dosingRange}; selected ${Math.round(
      doseMg
    )} mg based on patient weight`;
  }

  if (
    crcl !== null &&
    drug.renalThresholdCrCl &&
    crcl < Number(drug.renalThresholdCrCl)
  ) {
    adjustments.push(
      `Renal: CrCl ${crcl.toFixed(0)} mL/min is below the ${
        drug.renalThresholdCrCl
      } mL/min threshold. ${drug.renalAdjustment}`
    );
  }

  if (patient?.hepaticImpairment) {
    adjustments.push(
      `Hepatic: patient has hepatic impairment. ${drug.hepaticAdjustment}`
    );
  }

  const patientAllergies: string[] = (patient?.allergies || []).map((a: string) =>
    String(a).toLowerCase()
  );
  const crossReact: string[] = (drug.allergyCrossReact || []).map((a: string) =>
    String(a).toLowerCase()
  );
  const allergyConflict = patientAllergies.some((a) =>
    crossReact.some((c) => c.includes(a) || a.includes(c))
  );
  if (allergyConflict) {
    warnings.push(
      `ALLERGY CONFLICT: patient allergy overlaps with ${drug.name} (${drug.className}). Do NOT administer without verification.`
    );
  }

  const comorbidities: string[] = patient?.comorbidities || [];
  const contraindications: string[] = drug.contraindications || [];
  const comorbConflict = comorbidities.filter((c) =>
    contraindications.some((ci) =>
      String(ci).toLowerCase().includes(String(c).toLowerCase())
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
      )} mg/day) exceeds the maximum daily dose of ${
        drug.maxDailyDose
      } mg. Verify before dosing — do not silently cap.`
    );
  }

  return {
    recommended_dose: `${Math.round(doseMg)} mg per dose — ${drug.dosingRange}`,
    calculation_basis: basis,
    adjustments_applied: adjustments,
    warnings,
    disclaimer: DISCLAIMER,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload routes
  app.use("/api/upload", uploadRoutes);

  // User routes
  app.get("/api/users", async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      next(error);
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("Error creating users:", error);
      next(error);
      return;
    }
  });

  // Config route — lets the frontend know whether AI dosing is available
  app.get("/api/config", (req, res) => {
    res.json({ aiEnabled: AI_KEY_PRESENT });
  });

  // Dosing recommendation — uses Claude when a key is present,
  // otherwise falls back to the deterministic local rules engine.
  app.post("/api/dose", async (req, res, next) => {
    try {
      const { patient, metrics, drug } = dosePayloadSchema.parse(req.body);
      console.log("[dose] request for drug", drug?.name, "aiEnabled:", AI_KEY_PRESENT);

      // No AI key configured → local computation
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
          messages: [{ role: "user", content: userContent }],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        let raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
        raw = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

        const parsed = JSON.parse(raw);
        console.log("[dose] parsed AI result", parsed);
        res.json({ ...parsed, ai_powered: true });
      } catch (aiError) {
        // AI call failed (bad key, quota, network) → gracefully fall back
        console.error("[dose] AI call failed, falling back to local engine", aiError);
        const local = computeLocalDosing(patient, metrics, drug);
        res.json({ ...local, ai_powered: false });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("[dose] error", error);
      next(error);
    }
  });

  // History routes
  app.get("/api/history", async (req, res, next) => {
    try {
      const entries = await storage.getCalculations();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching history:", error);
      next(error);
    }
  });

  app.post("/api/history", async (req, res, next) => {
    try {
      const validated = insertCalculationSchema.parse(req.body);
      const entry = await storage.createCalculation(validated);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
        return;
      }
      console.error("Error creating history entry:", error);
      next(error);
    }
  });

  app.delete("/api/history", async (req, res, next) => {
    try {
      await storage.clearCalculations();
      res.json({ message: "History cleared" });
    } catch (error) {
      console.error("Error clearing history:", error);
      next(error);
    }
  });

  // Sitemap — all frontend routes
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const routes = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r => `  <url>\n    <loc>${baseUrl}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  const httpServer = createServer(app);
  return httpServer;
}