import type { Alert } from "../../../../types/types";

export default function ConfidenceInfo({ alert }: { alert: Alert | null }) {
  const format_confidence = (v: number) => {
    return `${Math.round(v * 100)}%`;
  };

  const getColor = (v: number) => {
    if (v >= 0.8) return "text-green-400";
    if (v >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mt-4 pb-4 border-b border-slate-800/50">
      {/* TITLE */}
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        Confidence Scores
      </h3>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "ML", value: alert?.ml_confidence ?? 0 },
          { label: "LLM", value: alert?.llm_confidence ?? 0 },
          { label: "Final", value: alert?.final_confidence ?? 0 },
        ].map((item) => (
          <div
            key={item.label}
            className="
              bg-slate-900/40
              backdrop-blur-md
              border border-slate-700/40
              rounded-xl
              p-3
              hover:border-slate-600/60
              transition
            "
          >
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
              {item.label}
            </p>

            <p className={`text-lg font-semibold ${getColor(item.value)}`}>
              {format_confidence(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
