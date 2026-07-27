export interface PatientMetrics {
  bmi: number | null;
  bsa: number | null;
  crcl: number | null;
}

export function calcBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function calcBSA(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function calcCrCl(
  age: number,
  weightKg: number,
  serumCr: number,
  sex: string
): number | null {
  if (!age || !weightKg || !serumCr) return null;
  const factor = sex === "female" ? 0.85 : 1;
  return ((140 - age) * weightKg * factor) / (72 * serumCr);
}

export function round(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}