import { AlertTriangle } from "lucide-react";
import type { TrafficRecord } from "../../../types/types";
export default function TrafficRowDetail({ row }: { row: TrafficRecord }) {
  return (
    <div className="p-4 space-y-4 border-t border-base-300">
      {row.explanation && (
        <div>
          <p className="text-xs font-semibold text-base-content/50 uppercase mb-1">
            Explanation
          </p>
          <p className="text-sm">{row.explanation}</p>
        </div>
      )}

      {row.recommended_action && (
        <div className="alert alert-warning py-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {row.recommended_action}
        </div>
      )}

      {(row.evidence ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-base-content/50 uppercase mb-1">
            Evidence
          </p>
          <ul className="space-y-1">
            {row.evidence!.map((e, i) => (
              <li
                key={i}
                className="text-sm font-mono bg-slate-700/50 rounded px-2 py-1"
              >
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {row.top_features && row.top_features.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-base-content/50 uppercase mb-2">
            Top features
          </p>
          <div className="space-y-1.5">
            {row.top_features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-base-content/60 w-32 shrink-0">
                  {f.name}
                </span>
                <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className="bg-fuchsia-500 h-1.5 rounded-full"
                    style={{ width: `${(f.importance * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="text-xs text-base-content/50 w-10 text-right shrink-0">
                  {(f.importance * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-base-content/60 w-32 shrink-0">
                  {f.name}
                  <span className="text-base-content/30 ml-1">= {f.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-base-content/50 pt-1">
        {row.ml_model && (
          <span>
            Model: <strong>{row.ml_model}</strong>
          </span>
        )}
        {row.llm_severity && (
          <span>
            LLM severity: <strong>{row.llm_severity}</strong>
          </span>
        )}
        {row.final_confidence && (
          <span>
            Final confidence:{" "}
            <strong>{(row.final_confidence * 100).toFixed(1)}%</strong>
          </span>
        )}
        {row.needs_review && (
          <span className="text-warning font-semibold">⚠ Needs review</span>
        )}
      </div>
    </div>
  );
}
