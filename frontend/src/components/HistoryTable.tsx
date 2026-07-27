import { HistoryEntry } from "@/lib/types";
import { History, Trash2 } from "lucide-react";

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
}

const HistoryTable = ({ entries, onClear }: Props) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground tracking-tight">Calculation History</h3>
      </div>
      {entries.length > 0 && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>

    {entries.length === 0 ? (
      <p className="px-6 py-8 text-sm text-muted-foreground text-center">
        No calculations yet. Completed dosing calculations will appear here.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="px-6 py-3 font-medium">Patient ID</th>
              <th className="px-6 py-3 font-medium">Drug</th>
              <th className="px-6 py-3 font-medium">Dose</th>
              <th className="px-6 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="px-6 py-3 font-medium text-foreground">{e.patientId || "—"}</td>
                <td className="px-6 py-3 text-foreground/90">{e.drugName}</td>
                <td className="px-6 py-3 font-mono text-xs text-foreground/90">{e.doseGiven}</td>
                <td className="px-6 py-3 text-muted-foreground text-xs">
                  {new Date(e.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default HistoryTable;