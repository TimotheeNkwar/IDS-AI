import { ShieldAlert, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import type { Suggestion } from "../../../types/types";

const ACTION_MAP: Record<
  string,
  {
    label: string;
    color: string;
    glow: string;
  }
> = {
  xss: {
    label: "Block IP",
    color:
      "from-red-500/20 to-red-700/10 border-red-500/30 text-red-300 light:from-red-50 light:to-red-100/60 light:border-red-200 light:text-red-600",
    glow: "shadow-red-500/10",
  },
  mitm: {
    label: "Block IP",
    color:
      "from-orange-500/20 to-orange-700/10 border-orange-500/30 text-orange-300 light:from-orange-50 light:to-orange-100/60 light:border-orange-200 light:text-orange-600",
    glow: "shadow-orange-500/10",
  },
  ddos: {
    label: "Mitigate Attack",
    color:
      "from-fuchsia-500/20 to-fuchsia-700/10 border-fuchsia-500/30 text-fuchsia-300 light:from-fuchsia-50 light:to-fuchsia-100/60 light:border-fuchsia-200 light:text-fuchsia-600",
    glow: "shadow-fuchsia-500/10",
  },
  password: {
    label: "Reset Credentials",
    color:
      "from-yellow-500/20 to-yellow-700/10 border-yellow-500/30 text-yellow-300 light:from-yellow-50 light:to-yellow-100/60 light:border-yellow-200 light:text-yellow-600",
    glow: "shadow-yellow-500/10",
  },
  scanning: {
    label: "Update Rules",
    color:
      "from-cyan-500/20 to-cyan-700/10 border-cyan-500/30 text-cyan-300 light:from-cyan-50 light:to-cyan-100/60 light:border-cyan-200 light:text-cyan-600",
    glow: "shadow-cyan-500/10",
  },
  default: {
    label: "Investigate",
    color:
      "from-slate-500/20 to-slate-700/10 border-slate-500/30 text-slate-300 light:from-slate-100 light:to-slate-200/60 light:border-slate-300 light:text-slate-600",
    glow: "shadow-slate-500/10",
  },
};

export default function SuggestionCard({
  suggestion,
}: {
  suggestion: Suggestion;
}) {
  const action = ACTION_MAP[suggestion.type] ?? ACTION_MAP.default;

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        light:bg-white/70 light:border-slate-200
        p-5 transition-all duration-300
        hover:border-slate-600 light:hover:border-slate-300
        mb-6 hover:-translate-y-1
        hover:shadow-2xl ${action.glow}
      `}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -top-20 -right-10 w-40 h-40 bg-red-500/10 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 pb-5 border-b border-slate-700/60 light:border-slate-200">
        <div className="flex gap-4">
          {/* Icon */}
          <div
            className="
              flex items-center justify-center
              w-14 h-14 rounded-2xl
              bg-linear-to-br from-red-500/20 to-red-700/10
              border border-red-500/20 text-red-300
              shadow-lg shadow-red-500/10
              light:from-red-50 light:to-red-100/60
              light:border-red-200 light:text-red-500
            "
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          {/* Text */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 light:text-fuchsia-500" />
              <p className="uppercase tracking-[0.2em] text-[10px] font-semibold text-slate-500 light:text-slate-400">
                Security Recommendation
              </p>
            </div>

            <h2 className="text-white light:text-slate-900 font-semibold text-lg leading-tight">
              {action.label}
            </h2>

            <p className="text-sm text-slate-400 light:text-slate-500 mt-1">
              Suspicious activity from{" "}
              <span className="text-slate-200 light:text-slate-700 font-medium">
                {suggestion.source_ip}
              </span>
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 light:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              {suggestion.type} detected {suggestion.count} times in last 24h
            </div>
          </div>
        </div>

        {/* Priority + type badges */}
        <div className="flex flex-col items-end gap-2">
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-semibold
              border backdrop-blur-md
              bg-gradient-to-r ${action.color}
            `}
          >
            {suggestion.priority}
          </span>

          <span
            className="
              px-3 py-1 rounded-full text-xs border
              border-slate-600 bg-slate-800 text-slate-300
              light:border-slate-200 light:bg-slate-100 light:text-slate-600
            "
          >
            {suggestion.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="relative py-5 space-y-3">
        <p className="text-slate-300 light:text-slate-700 leading-relaxed text-sm">
          {suggestion.description}
        </p>

        <div
          className="
            flex items-start gap-2 rounded-2xl border p-3
            border-slate-700 bg-slate-800/60
            light:border-slate-200 light:bg-slate-50/80
          "
        >
          <ArrowRight className="w-4 h-4 text-cyan-400 light:text-cyan-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300 light:text-slate-700">
            {suggestion.recommended_action}
          </p>
        </div>
      </div>

      {/* Knowledge tags */}
      <div className="flex flex-wrap gap-2">
        {suggestion.knowledge_matches.map((match, i) => (
          <span
            key={i}
            className="
              px-3 py-1 rounded-full text-xs font-medium border
              bg-slate-800/80 border-slate-700 text-slate-300
              hover:border-fuchsia-500/40 hover:text-white
              light:bg-slate-100 light:border-slate-200 light:text-slate-600
              light:hover:border-fuchsia-400 light:hover:text-fuchsia-700
              transition-all
            "
          >
            #{match}
          </span>
        ))}
      </div>
    </div>
  );
}
