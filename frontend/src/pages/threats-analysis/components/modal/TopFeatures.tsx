import type { Alert } from "../../../../types/types";

export default function TopFeatures({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4 border-b border-base-content/12 pb-4">
      <h3 className="text-gray-400 uppercase font-semibold mb-1">
        Top Features
      </h3>
      <div>
        {alert?.top_features && alert?.top_features.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-base-content/50 uppercase mb-2">
              Top features
            </p>
            <div className="space-y-1.5">
              {alert?.top_features.map((f, i) => (
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
                    <span className="text-base-content/30 ml-1">
                      = {f.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
