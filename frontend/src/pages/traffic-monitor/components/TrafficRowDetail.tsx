import { AlertTriangle } from "lucide-react";
import type { TrafficRecord } from "../../../types/types";

export default function TrafficRowDetail({
  row,
}: {
  row: TrafficRecord;
}) {
  return (
    <div className="p-4 space-y-5 border-t border-slate-800/50">

      {/* EXPLANATION */}
      {row.explanation && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Explanation
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {row.explanation}
          </p>
        </div>
      )}

      {/* RECOMMENDED ACTION */}
      {row.recommended_action && (
        <div className="
          flex items-start gap-2
          p-3 rounded-xl
          bg-yellow-500/10
          border border-yellow-500/20
        ">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />

          <p className="text-sm text-yellow-100">
            {row.recommended_action}
          </p>
        </div>
      )}

      {/* EVIDENCE */}
      {(row.evidence ?? []).length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Evidence
          </p>

          <ul className="space-y-1">
            {row.evidence!.map((e, i) => (
              <li
                key={i}
                className="
                  text-xs font-mono
                  bg-slate-900/40
                  border border-slate-800/50
                  rounded-lg
                  px-3 py-2
                  text-slate-300
                "
              >
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TOP FEATURES */}
      {row.top_features?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">
            Top Features
          </p>

          <div className="space-y-3">
            {row.top_features.map((f, i) => {
              const percent = (f.importance * 100).toFixed(1);

              return (
                <div
                  key={i}
                  className="
                    bg-slate-900/30
                    border border-slate-800/50
                    rounded-xl
                    p-3
                  "
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-300">
                      {f.name}
                    </span>

                    <span className="text-xs text-fuchsia-400">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fuchsia-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                    <span>value: {f.value}</span>
                    <span>impact score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* META INFO */}
      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-800/50">

        {row.ml_model && (
          <span>
            Model: <span className="text-slate-300">{row.ml_model}</span>
          </span>
        )}

        {row.llm_severity && (
          <span>
            LLM: <span className="text-slate-300">{row.llm_severity}</span>
          </span>
        )}

        {row.final_confidence && (
          <span>
            Confidence:{" "}
            <span className="text-slate-300">
              {(row.final_confidence * 100).toFixed(1)}%
            </span>
          </span>
        )}

        {row.needs_review && (
          <span className="text-yellow-400 font-semibold">
            ⚠ Needs review
          </span>
        )}
      </div>

    </div>
  );
}