import {
  Calculator,
  ShieldAlert,
  Sparkles,
  Activity,
  History,
  FlaskConical,
  UserRound,
  ClipboardCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    title: "Live clinical metrics",
    desc: "Instant BMI, BSA (Mosteller) and Cockcroft-Gault creatinine clearance as you enter vitals.",
  },
  {
    icon: Sparkles,
    title: "AI-powered reasoning",
    desc: "Context-aware dosing that factors comorbidities, medications and clinical nuance.",
  },
  {
    icon: ShieldAlert,
    title: "Allergy & contraindication screen",
    desc: "Automatic cross-reactivity and contraindication flags before any dose is suggested.",
  },
  {
    icon: FlaskConical,
    title: "Renal & hepatic adjustments",
    desc: "Threshold-based dose adjustments explained in plain clinical language.",
  },
  {
    icon: History,
    title: "Calculation history",
    desc: "Every recommendation is logged so your team can review and audit decisions.",
  },
  {
    icon: ClipboardCheck,
    title: "Verifiable by design",
    desc: "Structured, transparent output built to be confirmed by a licensed professional.",
  },
];

const STEPS = [
  {
    icon: UserRound,
    step: "01",
    title: "Enter patient data",
    desc: "Add vitals, allergies, comorbidities and the drug — or load a sample patient in one click.",
  },
  {
    icon: Calculator,
    step: "02",
    title: "Compute the dose",
    desc: "DoseWise calculates the weight- or BSA-based dose and applies clinical adjustments.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Review & verify",
    desc: "Get a structured recommendation with warnings, then confirm with your pharmacist.",
  },
];

const FeatureShowcase = () => (
  <>
    {/* Features */}
    <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Capabilities
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Everything you need for <span className="text-gradient-primary">confident dosing</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          A complete clinical workflow — not just a calculator. From intake to verified recommendation.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border bg-card card-elevated p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-foreground tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section id="how" className="border-y border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Workflow
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Three steps to a verified dose
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.step} className="relative rounded-2xl border border-border bg-card card-elevated p-6">
              <span className="absolute right-5 top-5 font-mono text-3xl font-bold text-primary/15">{s.step}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Trust */}
    <section id="trust" className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
      <div className="rounded-3xl border border-border gradient-primary text-primary-foreground p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <ShieldAlert className="h-8 w-8" />
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Built for safety, not shortcuts
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            DoseWise is clinical decision support — every recommendation is transparent, auditable,
            and explicitly requires confirmation by a licensed pharmacist or physician before
            administration. It never silently caps or overrides safety limits.
          </p>
        </div>
      </div>
    </section>
  </>
);

export default FeatureShowcase;