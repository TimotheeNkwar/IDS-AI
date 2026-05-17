import type { Alert } from "../../../../types/types";

export default function RiskSignals({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 pb-4 border-b border-slate-800/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Risk Signals
        </h3>
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Evidence
        </h3>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* RISK SIGNALS */}
        <div
          className="
          bg-slate-900/40
          backdrop-blur-md
          border border-yellow-500/20
          rounded-xl
          p-3
          space-y-2
        "
        >
          {alert?.risk_signals?.length ? (
            alert.risk_signals.map((signal, i) => (
              <div
                key={i}
                className="border-b border-slate-700/40 pb-2 last:border-none"
              >
                <p className="text-yellow-300 font-medium">
                  {signal.name.replace(/_/g, " ")}
                </p>
                <p className="text-slate-300 text-xs mt-1">{signal.evidence}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-xs">No risk signals detected</p>
          )}
        </div>

        {/* EVIDENCE */}
        <div
          className="
          bg-slate-900/40
          backdrop-blur-md
          border border-slate-700/40
          rounded-xl
          p-3
          space-y-2
        "
        >
          {alert?.evidence?.length ? (
            alert.evidence.map((e, i) => (
              <p
                key={i}
                className="
                  text-slate-200 text-xs
                  border-b border-slate-700/40
                  pb-2 last:border-none
                "
              >
                {e}
              </p>
            ))
          ) : (
            <p className="text-slate-500 text-xs">No evidence available</p>
          )}
        </div>
      </div>
    </div>
  );
}
