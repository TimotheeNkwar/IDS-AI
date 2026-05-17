import type { Alert } from "../../../../types/types";

export default function RecommendedAction({
  alert,
}: {
  alert: Alert | null;
}) {
  return (
    <div className="mt-4">

      {/* HEADER */}
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
        Recommended Action
      </h3>

      {/* CARD */}
      <div className="
        relative
        p-4
        rounded-xl
        bg-gradient-to-r from-yellow-900/20 to-amber-900/10
        border border-yellow-500/20
        backdrop-blur-md
        overflow-hidden
      ">

        {/* subtle glow */}
        <div className="absolute inset-0 opacity-20 bg-yellow-500 blur-2xl" />

        <div className="relative">

          {/* CONTENT */}
          <p className="text-sm text-slate-100 leading-relaxed">
            {alert?.recommended_action || "No recommendation available"}
          </p>

          {/* STATUS BADGE */}
          <div className="mt-3 flex items-center justify-between">

            <span className="text-[11px] text-yellow-300 font-medium">
              SOC Decision Layer
            </span>

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
              action required
            </span>

          </div>
        </div>
      </div>
    </div>
  );
}