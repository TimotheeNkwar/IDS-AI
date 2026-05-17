import type { Alert } from "../../../../types/types";
import { MessageSquareQuote } from "lucide-react";

export default function Message({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 pb-5 border-b border-slate-800/50 light:border-slate-200/70">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="
            w-8 h-8 rounded-xl
            flex items-center justify-center
            bg-fuchsia-500/10
            border border-fuchsia-500/20
            light:bg-fuchsia-500/5
            light:border-fuchsia-200
          "
        >
          <MessageSquareQuote className="w-4 h-4 text-fuchsia-400 light:text-fuchsia-500" />
        </div>

        <div>
          <h3
            className="
              text-[11px] uppercase tracking-[0.2em]
              text-slate-500 light:text-slate-600
              font-semibold
            "
          >
            Threat Message
          </h3>

          <p className="text-xs text-slate-600 light:text-slate-600">
            AI generated alert explanation
          </p>
        </div>
      </div>

      {/* Message Box */}
      <div
        className="
          relative overflow-hidden
          rounded-2xl
          border border-slate-700/40
          light:border-slate-200
          bg-slate-900/40
          light:bg-white/60
          backdrop-blur-xl
          px-5 py-4
        "
      >
        {/* Glow */}
        <div className="absolute -top-10 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Content */}
        <p
          className="
            relative z-10
            text-sm leading-relaxed
            text-slate-200
            light:text-slate-700
          "
        >
          {alert?.message || "No message available"}
        </p>
      </div>
    </div>
  );
}
