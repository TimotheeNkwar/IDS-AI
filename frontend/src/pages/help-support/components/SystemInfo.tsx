import { InfoIcon, Sparkles, Activity, ShieldCheck } from "lucide-react";

export default function SystemInfo() {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        p-5
      "
    >
      {/* Glow background */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full"></div>

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="
              w-12 h-12 rounded-2xl
              flex items-center justify-center
              bg-gradient-to-br from-cyan-500/20 to-cyan-700/10
              border border-cyan-500/20
              text-cyan-300
            "
          >
            <InfoIcon className="w-5 h-5" />
          </div>

          {/* Text */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <p className="uppercase tracking-[0.2em] text-[10px] text-slate-500 font-semibold">
                System Status
              </p>
            </div>

            <p className="text-base font-semibold text-white">
              System version 1.0.0
            </p>

            <p className="text-sm text-slate-400 mt-1">
              ML model: <span className="text-slate-200">XGBoost</span> · LLM:{" "}
              <span className="text-slate-200">enabled</span>
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <Activity className="w-3.5 h-3.5" />
              Real-time monitoring active
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <span
            className="
              flex items-center gap-2
              px-4 py-2 rounded-full
              bg-green-500/10 text-green-300
              border border-green-500/20
              text-xs font-medium
            "
          >
            <ShieldCheck className="w-4 h-4" />
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}
