export interface PatientData {
  patientId: string;
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  serumCr: number;
  hepaticImpairment: boolean;
  pregnancy: string;
  allergies: string[];
  comorbidities: string[];
  medications: string;
  surgery: string;
  drugId: string;
}

export interface DosingResult {
  recommended_dose: string;
  calculation_basis: string;
  adjustments_applied: string[];
  warnings: string[];
  disclaimer: string;
  missing_field?: string;
  /** true when the result came from the AI model, false when computed locally */
  ai_powered?: boolean;
}

export interface HistoryEntry {
  id: string;
  patientId: string;
  drugName: string;
  doseGiven: string;
  timestamp: number;
}