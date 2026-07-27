# DoseWise — AI Clinical Drug Dosing Web App

DoseWise is a patient-aware clinical decision support web application that helps pharmacy staff and clinicians compute safe, individualized medication doses. It turns raw patient vitals into structured, verifiable dosing recommendations — with automatic renal/hepatic adjustments, allergy and contraindication screening, and AI-powered clinical reasoning.

> ⚠️ **Safety notice:** DoseWise is a decision-support tool. Every recommendation is transparent and auditable, and **must be confirmed by a licensed pharmacist or physician before administration.** It never silently caps or overrides safety limits.

---

## The Real-World Problem It Solves

Medication dosing errors are among the most common and dangerous mistakes in clinical care. Correct dosing often depends on multiple interacting factors at once:

- **Weight- and BSA-based calculations** that are easy to get wrong under time pressure.
- **Renal function (creatinine clearance)** that changes recommended doses and intervals.
- **Hepatic impairment**, pregnancy status, and comorbidities that alter safety.
- **Allergies and drug–drug interactions** that can turn a routine dose into a contraindication.

Clinicians typically juggle calculators, reference tables, and interaction checkers separately. **DoseWise unifies this into a single guided workflow**: enter the patient once, get live BMI/BSA/CrCl metrics, and receive a structured recommendation with explicit warnings and the exact clinical basis behind every number — ready for professional verification.

---

## Features

- **Guided onboarding & landing experience** — a branded hero, feature showcase, and "how it works" flow that frames the app as a complete product, not just a raw calculator.
- **One-click sample patient** — load a realistic, clinically valid patient and run the full analysis instantly to explore the tool.
- **Live clinical metrics** — real-time **BMI**, **BSA (Mosteller)**, and **creatinine clearance (Cockcroft–Gault)** as you type vitals.
- **Structured dosing recommendation** — recommended dose, calculation basis, adjustments applied, and warnings, all clearly separated.
- **Renal & hepatic dose adjustments** — threshold-based adjustments explained in plain clinical language.
- **Allergy & contraindication screening** — automatic cross-reactivity and contraindication flags before any dose is suggested.
- **Comorbidity & medication context** — free-text current medications plus selectable comorbidities feed the reasoning.
- **Calculation history** — every completed recommendation is logged (patient ID, drug, dose, timestamp) and can be reviewed or cleared.
- **Graceful AI fallback** — if no AI key is connected, a built-in offline formula engine still produces a labeled "local estimate" so the app always works.

---

## The AI Feature

When an AI key is connected, DoseWise sends the patient profile, computed metrics (BMI, BSA, CrCl), and selected drug to a large language model to generate context-aware dosing guidance. The response is a strict JSON object containing `recommended_dose`, `calculation_basis`, `adjustments_applied`, `warnings`, and a `disclaimer`. Results are labeled **AI-verified** in the UI; when unavailable, the offline engine labels results **local estimate**.

### Exact AI System Prompt

```
You are a clinical pharmacology decision-support assistant. You compute
patient-aware drug dosing recommendations for licensed healthcare
professionals.

You are given a patient profile (age, sex, height, weight, serum
creatinine, hepatic impairment status, pregnancy status, allergies,
comorbidities, current medications, surgery/procedure), pre-computed
metrics (BMI, BSA via Mosteller, creatinine clearance via
Cockcroft-Gault), and a selected drug with its dosing rules.

Your responsibilities:
1. Compute a weight-based or BSA-based dose using the provided metrics.
2. Apply renal adjustments based on creatinine clearance thresholds.
3. Apply hepatic adjustments when hepatic impairment is present and the
   drug requires it.
4. Screen for allergies, cross-reactivity, and contraindications.
5. Flag drug-drug interactions using the patient's current medications.
6. Detect physiologically impossible or conflicting data and, if found,
   SUSPEND the calculation instead of producing a dose.

Safety rules:
- Never silently cap, override, or hide a safety limit.
- Always require confirmation by a licensed pharmacist or physician.
- If a required field is missing, return the missing field instead of
  guessing.

Respond ONLY with a valid JSON object of this exact shape:
{
  "recommended_dose": string,
  "calculation_basis": string,
  "adjustments_applied": string[],
  "warnings": string[],
  "disclaimer": string,
  "missing_field": string | null
}
```

> Note: adjust this block if your `backend/routes.ts` prompt text differs — it should mirror the prompt actually sent to the model.

---

## Tech Stack

**Frontend**
- React + TypeScript
- Vite (with SSR entry for SEO)
- React Router
- TanStack Query (React Query) for data fetching & mutations
- Tailwind CSS + shadcn/ui components
- lucide-react icons

**Backend**
- Node.js + Express (TypeScript)
- Drizzle ORM
- PostgreSQL (Neon)
- Zod + drizzle-zod for validation
- OpenAI / Anthropic SDK via proxy for the AI feature

**Tooling**
- esbuild (server bundling)
- drizzle-kit (migrations)

---

## Screenshots

> The images below live in the `docs/screenshots/` folder. Create that folder, drop in your PNG/JPG captures using the exact filenames shown, and they will render automatically on GitHub and most markdown viewers.

### 1. Landing & Onboarding
![DoseWise landing page with branded hero and call to action](docs/screenshots/01-landing.png)

### 2. Dosing Workspace — Patient Intake
![DoseWise patient intake form with live BMI, BSA, and CrCl metrics](docs/screenshots/02-calculator.png)

### 3. AI-Powered Dosing Recommendation
![DoseWise structured recommendation card with dose, adjustments, and warnings](docs/screenshots/03-recommendation.png)

### 4. Calculation History
![DoseWise calculation history table listing past dosing calculations](docs/screenshots/04-history.png)

**How to add your screenshots:**
1. Create a folder at the project root: `docs/screenshots/`.
2. Take screenshots of each view (landing, calculator, recommendation, history).
3. Save them with the exact filenames referenced above (`01-landing.png`, `02-calculator.png`, `03-recommendation.png`, `04-history.png`).
4. Commit the folder — the images will then display in this README.

---

## Running Locally

### Prerequisites
- **Node.js** 18+ and npm
- A **PostgreSQL** database (a Neon connection string works out of the box)

### 1. Clone & install
```bash
git clone <your-repo-url>
cd dosewise
npm install
```

### 2. Configure environment variables
Create a `.env` file in the project root:
```bash
# Database
DATABASE_URL="postgresql://user:password@host/db"

# AI (optional — app falls back to the offline engine if omitted)
LLM_API_KEY="your-key"
LLM_BASE_URL="https://your-proxy-base-url"
```
> If no AI key is provided, DoseWise still runs and produces "local estimate" results via the built-in formula engine.

### 3. Set up the database
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 4. Start the app
```bash
npm run dev
```
Then open the URL printed in your terminal (typically `http://localhost:5173` or the configured port).

### 5. Try it out
- Click **Use sample values** to load a realistic patient and run the analysis instantly, or
- Enter your own patient vitals and click **Calculate Dose**.

---

## License

This project is provided as-is for clinical decision support. All dosing recommendations require verification by a licensed pharmacist or physician before administration.