import { DosingResult } from "@/lib/types";
import { AlertTriangle, TriangleAlert, Info, Pill, CircleHelp, Sparkles, KeyRound } from "lucide-react";

const ResultCard = ({ result }: { result: DosingResult }) => {
  if (result.missing_field) {
    return (
      <div className="animate-fade-in bg-card border border-clinical-orange/40 rounded-2xl p-6 card-elevated">
        <div className="flex items-start gap-3">
          <CircleHelp className="h-5 w-5 text-clinical-orange shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">Missing required data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cannot compute a dose. Please provide the following field:{" "}
              <span className="font-semibold text-clinical-orange">
                {result.missing_field}
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAI = result.ai_powered !== false;

  return (
    <div className="animate-fade-in bg-card border border-border rounded-2xl overflow-hidden card-elevated">
      <div className="gradient-primary px-6 py-4 flex items-center gap-2 text-primary-foreground">
        <Pill className="h-5 w-5" />
        <h3 className="font-semibold tracking-tight">Dosing Recommendation</h3>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            isAI
              ? "bg-white/20 text-primary-foreground"
              : "bg-white/15 text-primary-foreground/90"
          }`}
        >
          {isAI ? (
            <>
              <Sparkles className="h-3 w-3" /> AI-verified
            </>
          ) : (
            <>
              <Info className="h-3 w-3" /> Local estimate
            </>
          )}
        </span>
      </div>

      {/* Notice shown when AI is NOT available */}
      {!isAI && (
        <div className="border-b border-border bg-clinical-orange-bg/60 px-6 py-4">
          <p className="flex items-start gap-2 text-sm text-foreground/90">
            <KeyRound className="h-4 w-4 text-clinical-orange shrink-0 mt-0.5" />
            <span>
              This result was calculated by the built-in offline formula engine.{" "}
              <span className="font-semibold text-clinical-orange">
                No AI key is connected
              </span>
              , so nuanced clinical reasoning is limited and the recommendation
              may be less precise. Connect your own AI API key to get
              AI-verified, context-aware dosing guidance.
            </span>
          </p>
        </div>
      )}

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recommended Dose
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-gradient-primary">
            {result.recommended_dose}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Calculation Basis
          </p>
          <p className="mt-1 text-sm text-foreground/90 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {result.calculation_basis}
          </p>
        </div>

        {result.adjustments_applied.length > 0 && (
          <div className="rounded-xl bg-clinical-orange-bg border border-clinical-orange/30 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-clinical-orange">
              <TriangleAlert className="h-4 w-4" /> Adjustments Applied
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.adjustments_applied.map((a, i) => (
                <li key={i} className="text-sm text-foreground/90 pl-1">
                  • {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="rounded-xl bg-clinical-warning-bg border border-destructive/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Warnings
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-sm text-destructive/90 font-medium pl-1">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="text-sm font-bold text-foreground">{result.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;