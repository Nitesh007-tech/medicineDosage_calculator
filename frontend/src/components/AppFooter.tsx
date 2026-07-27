import { Stethoscope } from "lucide-react";

const AppFooter = () => (
  <footer className="border-t border-border bg-card">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Dose<span className="text-gradient-primary">Wise</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Safety</a>
          <a href="#calculator" className="hover:text-foreground transition-colors">Calculator</a>
        </nav>
      </div>
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} DoseWise. A clinical decision support tool — all recommendations
          require verification by a licensed pharmacist or physician before administration.
        </p>
      </div>
    </div>
  </footer>
);

export default AppFooter;