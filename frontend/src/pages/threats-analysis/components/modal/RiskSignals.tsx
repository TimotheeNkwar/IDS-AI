import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function RiskSignals({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    divider: isDark ? "border-slate-800/50" : "border-slate-200",
    sectionLabel: isDark ? "text-slate-500" : "text-slate-400",

    // Risk signals card
    riskCard: isDark
      ? "bg-slate-900/40 backdrop-blur-md border-yellow-500/20"
      : "bg-yellow-50 border-yellow-200",
    riskItemBorder: isDark ? "border-slate-700/40" : "border-yellow-100",
    riskName: isDark ? "text-yellow-300" : "text-yellow-700",
    riskEvidence: isDark ? "text-slate-300" : "text-slate-600",

    // Evidence card
    evidenceCard: isDark
      ? "bg-slate-900/40 backdrop-blur-md border-slate-700/40"
      : "bg-slate-50 border-slate-200",
    evidenceBorder: isDark ? "border-slate-700/40" : "border-slate-200",
    evidenceText: isDark ? "text-slate-200" : "text-slate-700",

    // Empty states
    empty: isDark ? "text-slate-500" : "text-slate-400",
  };

  return (
    <div className={`mt-4 pb-4 border-b ${t.divider}`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-xs uppercase tracking-widest font-semibold ${t.sectionLabel}`}
        >
          Risk Signals
        </h3>
        <h3
          className={`text-xs uppercase tracking-widest font-semibold ${t.sectionLabel}`}
        >
          Evidence
        </h3>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* RISK SIGNALS */}
        <div className={`border rounded-xl p-3 space-y-2 ${t.riskCard}`}>
          {alert?.risk_signals?.length ? (
            alert.risk_signals.map((signal, i) => (
              <div
                key={i}
                className={`border-b pb-2 last:border-none ${t.riskItemBorder}`}
              >
                <p className={`font-medium ${t.riskName}`}>
                  {signal.name.replace(/_/g, " ")}
                </p>
                <p className={`text-xs mt-1 ${t.riskEvidence}`}>
                  {signal.evidence}
                </p>
              </div>
            ))
          ) : (
            <p className={`text-xs ${t.empty}`}>No risk signals detected</p>
          )}
        </div>

        {/* EVIDENCE */}
        <div className={`border rounded-xl p-3 space-y-2 ${t.evidenceCard}`}>
          {alert?.evidence?.length ? (
            alert.evidence.map((e, i) => (
              <p
                key={i}
                className={`text-xs border-b pb-2 last:border-none ${t.evidenceBorder} ${t.evidenceText}`}
              >
                {e}
              </p>
            ))
          ) : (
            <p className={`text-xs ${t.empty}`}>No evidence available</p>
          )}
        </div>
      </div>
    </div>
  );
}
