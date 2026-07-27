import { ArrowRight, ShieldCheck, Sparkles, Activity } from "lucide-react";

interface LandingHeroProps {
  onLaunch: () => void;
}

const LandingHero = ({ onLaunch }: LandingHeroProps) => (
  <section className="relative overflow-hidden">
    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full gradient-primary opacity-[0.10] blur-2xl" />
    <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-primary-accent/10 blur-2xl" />

    <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-2 gap-12 items-center">
      <div className="animate-fade-in">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI-assisted clinical decision support
        </span>

        <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
          Precision dosing,
          <span className="block text-gradient-primary">designed for the bedside.</span>
        </h1>

        <p className="mt-5 max-w-xl text-base md:text-lg text-muted-foreground">
          DoseWise turns patient vitals into structured, patient-aware dosing recommendations —
          with automatic renal and hepatic adjustments, allergy checks, and contraindication
          screening, all verified by your clinical team.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={onLaunch}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Launch the calculator <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
          >
            See how it works
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Pharmacist-verifiable</span>
          <span className="inline-flex items-center gap-1.5"><Activity className="h-4 w-4 text-primary" /> Live BMI · BSA · CrCl</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI-powered reasoning</span>
        </div>
      </div>

      <div className="relative animate-fade-in">
        <div className="rounded-3xl border border-border bg-card card-elevated overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&h=700&fit=crop"
            alt="Clinician reviewing medication dosing on screen"
            className="w-full h-72 md:h-[26rem] object-cover"
            loading="eager"
          />
        </div>
        <div className="absolute -bottom-5 -left-4 md:left-6 rounded-2xl border border-border glass card-elevated px-5 py-4 max-w-[15rem]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommended Dose</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gradient-primary">1230–1640 mg q8–12h</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Renal-adjusted · Allergy-checked</p>
        </div>
      </div>
    </div>
  </section>
);

export default LandingHero;