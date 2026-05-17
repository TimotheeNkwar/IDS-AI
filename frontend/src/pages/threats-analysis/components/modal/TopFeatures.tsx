import type { Alert } from "../../../../types/types";

export default function TopFeatures({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 pb-4 border-b border-slate-800/50">

      {/* TITLE */}
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        Top Features
      </h3>

      {/* EMPTY STATE */}
      {!alert?.top_features?.length ? (
        <p className="text-xs text-slate-500">No feature data available</p>
      ) : (
        <div className="space-y-3">

          {alert.top_features.map((f, i) => {
            const percent = (f.importance * 100).toFixed(1);

            return (
              <div
                key={i}
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

                {/* TOP ROW */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-300">
                    {f.name}
                  </span>

                  <span className="text-xs text-fuchsia-400 font-semibold">
                    {percent}%
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* VALUE INFO */}
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>value: {f.value}</span>
                  <span>impact score</span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}