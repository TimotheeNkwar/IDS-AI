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
    color: "from-red-500/20 to-red-700/10 border-red-500/30 text-red-300",
    glow: "shadow-red-500/10",
  },
  mitm: {
    label: "Block IP",
    color:
      "from-orange-500/20 to-orange-700/10 border-orange-500/30 text-orange-300",
    glow: "shadow-orange-500/10",
  },
  ddos: {
    label: "Mitigate Attack",
    color:
      "from-fuchsia-500/20 to-fuchsia-700/10 border-fuchsia-500/30 text-fuchsia-300",
    glow: "shadow-fuchsia-500/10",
  },
  password: {
    label: "Reset Credentials",
    color:
      "from-yellow-500/20 to-yellow-700/10 border-yellow-500/30 text-yellow-300",
    glow: "shadow-yellow-500/10",
  },
  scanning: {
    label: "Update Rules",
    color: "from-cyan-500/20 to-cyan-700/10 border-cyan-500/30 text-cyan-300",
    glow: "shadow-cyan-500/10",
  },
  default: {
    label: "Investigate",
    color:
      "from-slate-500/20 to-slate-700/10 border-slate-500/30 text-slate-300",
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
        p-5 transition-all duration-300
        hover:border-slate-600
        mb-6
        hover:-translate-y-1
        hover:shadow-2xl ${action.glow}
      `}
    >
      {/* Glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -top-20 -right-10 w-40 h-40 bg-red-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 pb-5 border-b border-slate-700/60">
        <div className="flex gap-4">
          {/* Icon */}
          <div
            className="
              flex items-center justify-center
              w-14 h-14 rounded-2xl
              bg-linear-to-br from-red-500/20 to-red-700/10
              border border-red-500/20
              text-red-300
              shadow-lg shadow-red-500/10
            "
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          {/* Text */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />

              <p className="uppercase tracking-[0.2em] text-[10px] text-slate-500 font-semibold">
                Security Recommendation
              </p>
            </div>

            <h2 className="text-white font-semibold text-lg leading-tight">
              {action.label}
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Suspicious activity from{" "}
              <span className="text-slate-200 font-medium">
                {suggestion.source_ip}
              </span>
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              {suggestion.type} detected {suggestion.count} times in last 24h
            </div>
          </div>
        </div>

        {/* Priority */}
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

          <span className="px-3 py-1 rounded-full text-xs border border-slate-600 bg-slate-800 text-slate-300">
            {suggestion.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="relative py-5 space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          {suggestion.description}
        </p>

        <div className="flex items-start gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
          <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />

          <p className="text-sm text-slate-300">
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
              px-3 py-1 rounded-full
              text-xs font-medium
              bg-slate-800/80
              border border-slate-700
              text-slate-300
              hover:border-fuchsia-500/40
              hover:text-white
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
