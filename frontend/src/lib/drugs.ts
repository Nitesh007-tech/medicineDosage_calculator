export interface DrugReference {
  id: string;
  name: string;
  className: string;
  dosingRange: string;
  dosingBasis: "mg/kg" | "mg/m2" | "fixed";
  minDose: number; // per unit basis
  maxDose: number; // per unit basis
  maxDailyDose: number; // mg absolute
  renalThresholdCrCl: number; // mL/min below which adjustment needed
  renalAdjustment: string;
  hepaticAdjustment: string;
  contraindications: string[];
  allergyCrossReact: string[];
  notes: string;
}

export const DRUGS: DrugReference[] = [
  {
    id: "vancomycin",
    name: "Vancomycin",
    className: "Glycopeptide antibiotic",
    dosingRange: "15–20 mg/kg every 8–12h",
    dosingBasis: "mg/kg",
    minDose: 15,
    maxDose: 20,
    maxDailyDose: 4000,
    renalThresholdCrCl: 50,
    renalAdjustment: "Extend interval to q24–48h; trough-guided dosing when CrCl < 50 mL/min.",
    hepaticAdjustment: "No routine hepatic adjustment required.",
    contraindications: ["renal impairment", "hearing loss"],
    allergyCrossReact: ["vancomycin", "glycopeptides"],
    notes: "Nephrotoxic; monitor serum trough levels.",
  },
  {
    id: "enoxaparin",
    name: "Enoxaparin",
    className: "Low molecular weight heparin",
    dosingRange: "1 mg/kg q12h (treatment)",
    dosingBasis: "mg/kg",
    minDose: 1,
    maxDose: 1,
    maxDailyDose: 200,
    renalThresholdCrCl: 30,
    renalAdjustment: "Reduce to 1 mg/kg once daily when CrCl < 30 mL/min.",
    hepaticAdjustment: "Use with caution in severe hepatic impairment (bleeding risk).",
    contraindications: ["active bleeding", "renal impairment"],
    allergyCrossReact: ["heparin", "enoxaparin", "pork products"],
    notes: "Anti-Xa monitoring in renal impairment or extremes of weight.",
  },
  {
    id: "cefazolin",
    name: "Cefazolin",
    className: "1st-generation cephalosporin",
    dosingRange: "1–2 g IV q8h (2–3 g if >120 kg)",
    dosingBasis: "fixed",
    minDose: 1000,
    maxDose: 2000,
    maxDailyDose: 6000,
    renalThresholdCrCl: 35,
    renalAdjustment: "Extend interval to q12h when CrCl < 35 mL/min.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["penicillin allergy (severe)"],
    allergyCrossReact: ["cephalosporins", "penicillin", "beta-lactams", "cefazolin"],
    notes: "Surgical prophylaxis: administer within 60 minutes before incision.",
  },
  {
    id: "gentamicin",
    name: "Gentamicin",
    className: "Aminoglycoside antibiotic",
    dosingRange: "5–7 mg/kg once daily (extended interval)",
    dosingBasis: "mg/kg",
    minDose: 5,
    maxDose: 7,
    maxDailyDose: 560,
    renalThresholdCrCl: 60,
    renalAdjustment: "Extend dosing interval based on CrCl; monitor levels when CrCl < 60 mL/min.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["renal impairment", "hearing loss", "myasthenia gravis"],
    allergyCrossReact: ["aminoglycosides", "gentamicin"],
    notes: "Nephrotoxic and ototoxic; monitor peak/trough levels.",
  },
  {
    id: "acyclovir",
    name: "Acyclovir",
    className: "Antiviral (nucleoside analog)",
    dosingRange: "5–10 mg/kg IV q8h",
    dosingBasis: "mg/kg",
    minDose: 5,
    maxDose: 10,
    maxDailyDose: 3000,
    renalThresholdCrCl: 50,
    renalAdjustment: "Reduce frequency to q12–24h when CrCl < 50 mL/min; ensure hydration.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["renal impairment", "dehydration"],
    allergyCrossReact: ["acyclovir", "valacyclovir"],
    notes: "Crystalluria risk; maintain adequate hydration.",
  },
  {
    id: "carboplatin",
    name: "Carboplatin",
    className: "Platinum chemotherapy agent",
    dosingRange: "AUC-based (Calvert) / ~360 mg/m² q4wk",
    dosingBasis: "mg/m2",
    minDose: 300,
    maxDose: 400,
    maxDailyDose: 900,
    renalThresholdCrCl: 60,
    renalAdjustment: "Dose calculated on renal function (Calvert formula); reduce AUC target when CrCl < 60 mL/min.",
    hepaticAdjustment: "Use caution; no fixed adjustment established.",
    contraindications: ["severe bone marrow suppression", "renal impairment"],
    allergyCrossReact: ["platinum agents", "carboplatin", "cisplatin"],
    notes: "Myelosuppressive; monitor CBC. Pregnancy contraindicated (teratogenic).",
  },
];

export const getDrug = (id: string) => DRUGS.find((d) => d.id === id);