interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  hint?: string;
}

const MetricCard = ({ label, value, unit, hint }: MetricCardProps) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-card card-elevated p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
    <div className="absolute inset-x-0 top-0 h-1 gradient-primary opacity-70" />
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {label}
    </p>
    <p className="mt-1.5 font-mono text-2xl font-semibold text-gradient-primary">
      {value}
      <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>
    </p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default MetricCard;