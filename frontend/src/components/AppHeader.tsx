import { Stethoscope } from "lucide-react";

interface AppHeaderProps {
  onLaunch: () => void;
}

const AppHeader = ({ onLaunch }: AppHeaderProps) => (
  <header className="sticky top-0 z-30 border-b border-border glass">
    <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
      <a href="#top" className="flex items-center gap-2.5 shrink-0">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
          <Stethoscope className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <span className="block text-lg font-bold tracking-tight text-foreground">
            Dose<span className="text-gradient-primary">Wise</span>
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Clinical Dosing Suite
          </span>
        </div>
      </a>

      <nav className="hidden md:flex items-center gap-7 mx-auto text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
        <a href="#trust" className="hover:text-foreground transition-colors">Safety</a>
      </nav>

      <button
        onClick={onLaunch}
        className="ml-auto md:ml-0 inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
      >
        Open Calculator
      </button>
    </div>
  </header>
);

export default AppHeader;