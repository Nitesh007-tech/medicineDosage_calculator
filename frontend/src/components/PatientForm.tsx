import { useState, useMemo } from "react";
import { PatientData } from "@/lib/types";
import { DRUGS } from "@/lib/drugs";
import { calcBMI, calcBSA, calcCrCl, round } from "@/lib/calculators";
import MetricCard from "./MetricCard";
import MultiSelect from "./MultiSelect";
import { Loader2, Calculator, User, Activity, FlaskConical, Sparkles } from "lucide-react";

const ALLERGIES = ["penicillin", "cephalosporins", "vancomycin", "heparin", "aminoglycosides", "platinum agents", "acyclovir"];
const COMORBIDITIES = ["diabetes", "hypertension", "renal impairment", "hepatic impairment"];

interface Props {
  onSubmit: (data: PatientData, crcl: number | null) => void;
  loading: boolean;
}

const inputCls =
  "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pb-1">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
  </div>
);

// Realistic, clinically-valid sample patient used for one-click demos.
const SAMPLE_PATIENT = {
  patientId: "MRN-00482",
  age: "64",
  sex: "male",
  heightCm: "175",
  weightKg: "82",
  serumCr: "1.1",
  hepatic: false,
  pregnancy: "not_applicable",
  allergies: ["penicillin"],
  comorbidities: ["hypertension", "diabetes"],
  medications: "Metformin 500 mg BID, Lisinopril 10 mg daily",
  surgery: "none",
  drugId: "vancomycin",
};

const PatientForm = ({ onSubmit, loading }: Props) => {
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [serumCr, setSerumCr] = useState("");
  const [hepatic, setHepatic] = useState(false);
  const [pregnancy, setPregnancy] = useState("not_applicable");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [surgery, setSurgery] = useState("none");
  const [drugId, setDrugId] = useState(DRUGS[0].id);

  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const a = parseFloat(age);
  const cr = parseFloat(serumCr);

  const metrics = useMemo(() => {
    return {
      bmi: calcBMI(w, h),
      bsa: calcBSA(w, h),
      crcl: calcCrCl(a, w, cr, sex),
    };
  }, [w, h, a, cr, sex]);

  const buildData = (
    overrides?: Partial<{
      patientId: string;
      age: number;
      sex: string;
      heightCm: number;
      weightKg: number;
      serumCr: number;
      hepatic: boolean;
      pregnancy: string;
      allergies: string[];
      comorbidities: string[];
      medications: string;
      surgery: string;
      drugId: string;
    }>
  ): PatientData => ({
    patientId: overrides?.patientId ?? patientId,
    age: overrides?.age ?? (a || 0),
    sex: overrides?.sex ?? sex,
    heightCm: overrides?.heightCm ?? (h || 0),
    weightKg: overrides?.weightKg ?? (w || 0),
    serumCr: overrides?.serumCr ?? (cr || 0),
    hepaticImpairment: overrides?.hepatic ?? hepatic,
    pregnancy: overrides?.pregnancy ?? pregnancy,
    allergies: overrides?.allergies ?? allergies,
    comorbidities: overrides?.comorbidities ?? comorbidities,
    medications: overrides?.medications ?? medications,
    surgery: overrides?.surgery ?? surgery,
    drugId: overrides?.drugId ?? drugId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(buildData(), metrics.crcl);
  };

  // Fills the form with a realistic sample patient AND immediately runs the analysis.
  const handleUseSample = () => {
    setPatientId(SAMPLE_PATIENT.patientId);
    setAge(SAMPLE_PATIENT.age);
    setSex(SAMPLE_PATIENT.sex);
    setHeightCm(SAMPLE_PATIENT.heightCm);
    setWeightKg(SAMPLE_PATIENT.weightKg);
    setSerumCr(SAMPLE_PATIENT.serumCr);
    setHepatic(SAMPLE_PATIENT.hepatic);
    setPregnancy(SAMPLE_PATIENT.pregnancy);
    setAllergies(SAMPLE_PATIENT.allergies);
    setComorbidities(SAMPLE_PATIENT.comorbidities);
    setMedications(SAMPLE_PATIENT.medications);
    setSurgery(SAMPLE_PATIENT.surgery);
    setDrugId(SAMPLE_PATIENT.drugId);

    const sampleAge = parseFloat(SAMPLE_PATIENT.age);
    const sampleWeight = parseFloat(SAMPLE_PATIENT.weightKg);
    const sampleCr = parseFloat(SAMPLE_PATIENT.serumCr);
    const sampleCrcl = calcCrCl(sampleAge, sampleWeight, sampleCr, SAMPLE_PATIENT.sex);

    const data = buildData({
      patientId: SAMPLE_PATIENT.patientId,
      age: sampleAge,
      sex: SAMPLE_PATIENT.sex,
      heightCm: parseFloat(SAMPLE_PATIENT.heightCm),
      weightKg: sampleWeight,
      serumCr: sampleCr,
      hepatic: SAMPLE_PATIENT.hepatic,
      pregnancy: SAMPLE_PATIENT.pregnancy,
      allergies: SAMPLE_PATIENT.allergies,
      comorbidities: SAMPLE_PATIENT.comorbidities,
      medications: SAMPLE_PATIENT.medications,
      surgery: SAMPLE_PATIENT.surgery,
      drugId: SAMPLE_PATIENT.drugId,
    });

    onSubmit(data, sampleCrcl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sample data helper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm text-foreground/80">
          Don't have patient values on hand?{" "}
          <span className="font-medium text-foreground">Load a sample patient</span> and run the
          analysis instantly.
        </p>
        <button
          type="button"
          onClick={handleUseSample}
          disabled={loading}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-card px-3.5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          Use sample values
        </button>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="BMI" value={round(metrics.bmi)} unit="kg/m²" />
        <MetricCard label="BSA (Mosteller)" value={round(metrics.bsa, 2)} unit="m²" />
        <MetricCard label="CrCl (Cockcroft-Gault)" value={round(metrics.crcl, 0)} unit="mL/min" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 card-elevated">
        <div className="space-y-4">
          <SectionHeader icon={User} title="Patient & Drug" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Patient Name / ID</label>
              <input className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. MRN-00482" />
            </div>
            <div>
              <label className={labelCls}>Selected Drug</label>
              <select className={inputCls} value={drugId} onChange={(e) => setDrugId(e.target.value)}>
                {DRUGS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.className}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <SectionHeader icon={Activity} title="Vitals & Measurements" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Age</label>
              <input type="number" className={inputCls} value={age} onChange={(e) => setAge(e.target.value)} placeholder="yrs" />
            </div>
            <div>
              <label className={labelCls}>Sex</label>
              <select className={inputCls} value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Height</label>
              <input type="number" className={inputCls} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="cm" />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input type="number" className={inputCls} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="kg" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Serum Creatinine</label>
              <input type="number" step="0.01" className={inputCls} value={serumCr} onChange={(e) => setSerumCr(e.target.value)} placeholder="mg/dL" />
            </div>
            <div>
              <label className={labelCls}>Pregnancy Status</label>
              <select className={inputCls} value={pregnancy} onChange={(e) => setPregnancy(e.target.value)}>
                <option value="not_applicable">Not applicable</option>
                <option value="not_pregnant">Not pregnant</option>
                <option value="pregnant">Pregnant</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Surgery / Procedure</label>
              <select className={inputCls} value={surgery} onChange={(e) => setSurgery(e.target.value)}>
                <option value="none">None</option>
                <option value="elective">Elective surgery</option>
                <option value="emergency">Emergency surgery</option>
                <option value="prophylaxis">Pre-op prophylaxis</option>
              </select>
            </div>
          </div>

          <label htmlFor="hepatic" className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 cursor-pointer hover:bg-secondary/60 transition-colors">
            <input id="hepatic" type="checkbox" checked={hepatic} onChange={(e) => setHepatic(e.target.checked)} className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]" />
            <span className="text-sm font-medium text-foreground">Hepatic impairment present</span>
          </label>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <SectionHeader icon={FlaskConical} title="Clinical Context" />
          <div>
            <label className={labelCls}>Known Allergies</label>
            <MultiSelect options={ALLERGIES} selected={allergies} onChange={setAllergies} />
          </div>

          <div>
            <label className={labelCls}>Comorbidities</label>
            <MultiSelect options={COMORBIDITIES} selected={comorbidities} onChange={setComorbidities} />
          </div>

          <div>
            <label className={labelCls}>Current Medications</label>
            <textarea className={inputCls + " min-h-[72px] resize-y"} value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Free text — list current medications" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:hover:shadow-md"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {loading ? "Calculating…" : "Calculate Dose"}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;