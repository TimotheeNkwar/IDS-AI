import type { Alert } from "../../../../types/types";

export default function Message({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 pb-4 border-b border-slate-800/50">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
        Message
      </h3>

      <div
        className="
        bg-slate-900/40
        border border-slate-700/40
        backdrop-blur-md
        rounded-xl
        p-4
        text-sm text-slate-200
        leading-relaxed
      "
      >
        {alert?.message}
      </div>
    </div>
  );
}
