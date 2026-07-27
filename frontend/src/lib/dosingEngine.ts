import { PatientData, DosingResult } from "./types";
import { getDrug } from "./drugs";
import { calcBSA } from "./calculators";

const DISCLAIMER =
  "This is a computed suggestion. Confirm with a licensed pharmacist or physician before administration.";

function fixedDose(weightKg: number, min: number, max: number): number {
  return weightKg > 120 ? max : min;
}

/**
 * Clinical rules engine that mirrors the Claude system prompt logic.
 * Produces the exact structured JSON contract used by the result card.
 */
export function computeDosing(
  p: PatientData,
  crcl: number | null
): DosingResult {
  const drug = getDrug(p.drugId);
  if (!drug) {
    return {
      recommended_dose: "",
      calculation_basis: "",
      adjustments_applied: [],
      warnings: [],
      disclaimer: DISCLAIMER,
      missing_field: "drug selection",
    };
  }

  if (!p.weightKg || !p.heightCm || !p.age || !p.serumCr) {
    const missing = !p.weightKg
      ? "weight"
      : !p.heightCm
      ? "height"
      : !p.age
      ? "age"
      : "serum creatinine";
    return {
      recommended_dose: "",
      calculation_basis: "",
      adjustments_applied: [],
      warnings: [],
      disclaimer: DISCLAIMER,
      missing_field: missing,
    };
  }

  const adjustments: string[] = [];
  const warnings: string[] = [];

  let doseMg = 0;
  let basis = "";
  if (drug.dosingBasis === "mg/kg") {
    const mid = (drug.minDose + drug.maxDose) / 2;
    doseMg = mid * p.weightKg;
    basis = `${mid} mg/kg × ${p.weightKg} kg = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else if (drug.dosingBasis === "mg/m2") {
    const bsa = calcBSA(p.weightKg, p.heightCm) || 0;
    const mid = (drug.minDose + drug.maxDose) / 2;
    doseMg = mid * bsa;
    basis = `${mid} mg/m² × ${bsa.toFixed(2)} m² BSA = ${Math.round(
      doseMg
    )} mg per dose (${drug.dosingRange})`;
  } else {
    doseMg = fixedDose(p.weightKg, drug.minDose, drug.maxDose);
    basis = `Fixed dosing ${drug.dosingRange}; selected ${Math.round(
      doseMg
    )} mg based on patient weight`;
  }

  if (crcl !== null && crcl < drug.renalThresholdCrCl) {
    adjustments.push(
      `Renal: CrCl ${crcl.toFixed(0)} mL/min is below the ${
        drug.renalThresholdCrCl
      } mL/min threshold. ${drug.renalAdjustment}`
    );
  }

  if (p.hepaticImpairment) {
    adjustments.push(
      `Hepatic: patient has hepatic impairment. ${drug.hepaticAdjustment}`
    );
  }

  const patientAllergies = p.allergies.map((a) => a.toLowerCase());
  const crossReact = drug.allergyCrossReact.map((a) => a.toLowerCase());
  const allergyConflict = patientAllergies.some((a) =>
    crossReact.some((c) => c.includes(a) || a.includes(c))
  );
  if (allergyConflict) {
    warnings.push(
      `ALLERGY CONFLICT: patient allergy overlaps with ${drug.name} (${drug.className}). Do NOT administer without verification.`
    );
  }

  const comorbConflict = p.comorbidities.filter((c) =>
    drug.contraindications.some((ci) =>
      ci.toLowerCase().includes(c.toLowerCase())
    )
  );
  if (comorbConflict.length > 0) {
    warnings.push(
      `CONTRAINDICATION: comorbidity "${comorbConflict.join(
        ", "
      )}" is a documented contraindication for ${drug.name}.`
    );
  }

  if (p.pregnancy === "pregnant" && drug.id === "carboplatin") {
    warnings.push(
      `PREGNANCY: ${drug.name} is teratogenic and contraindicated in pregnancy.`
    );
  }

  if (p.surgery !== "none" && drug.id === "cefazolin") {
    adjustments.push(
      "Surgical prophylaxis: administer within 60 minutes before incision for optimal tissue levels."
    );
  }

  const dailyEstimate =
    drug.dosingBasis === "fixed" ? doseMg * 3 : doseMg * 2;
  if (dailyEstimate > drug.maxDailyDose) {
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