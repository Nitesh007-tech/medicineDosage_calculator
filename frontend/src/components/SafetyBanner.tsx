import { ShieldAlert } from "lucide-react";

const SafetyBanner = () => (
  <div className="w-full gradient-primary text-primary-foreground">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-medium tracking-tight">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>Clinical decision support only — not a substitute for professional judgment.</span>
    </div>
  </div>
);

export default SafetyBanner;