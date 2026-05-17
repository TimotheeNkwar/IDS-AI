import { ShieldAlert, ShieldBan } from "lucide-react";
import type { Alert } from "../../../../types/types";

export default function ModalHeader({ alert }: { alert: Alert | null }) {
  const severity = alert?.severity;
  const status = alert?.status;

  return (
    <div className="flex items-start justify-between gap-4">

      {/* LEFT SIDE */}
      <div className="flex items-start gap-3">

        {/* ICON BLOCK */}
        <div
          className={`
            p-2 rounded-xl border
            ${severity === "high"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"}
          `}
        >
          {severity === "high" ? (
            <ShieldBan className="w-5 h-5 text-red-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-yellow-400" />
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col">

          {/* TYPE + BADGES */}
          <div className="flex items-center gap-2 flex-wrap">

            <p className="text-sm font-semibold text-slate-100">
              {alert?.type}
            </p>

            <span
              className={`
                text-[11px] px-2 py-0.5 rounded-full border
                ${severity === "high"
                  ? "bg-red-500/10 text-red-300 border-red-500/20"
                  : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"}
              `}
            >
              {severity}
            </span>

            <span
              className={`
                text-[11px] px-2 py-0.5 rounded-full border
                ${status === "open"
                  ? "bg-green-500/10 text-green-300 border-green-500/20"
                  : "bg-slate-500/10 text-slate-300 border-slate-500/20"}
              `}
            >
              {status}
            </span>
          </div>

          {/* META */}
          <div className="mt-1 text-[11px] text-slate-500 flex gap-3 flex-wrap">
            <span>
              {alert?.timestamp
                ? new Date(alert.timestamp).toLocaleString()
                : "—"}
            </span>
            <span className="font-mono">ID: {alert?.id}</span>
          </div>
        </div>
      </div>

      {/* CLOSE */}
      <form method="dialog">
        <button
          className="
            w-8 h-8 rounded-lg
            bg-slate-800/40 hover:bg-slate-700/40
            border border-slate-700/40
            text-slate-300 hover:text-white
            transition
          "
        >
          ✕
        </button>
      </form>
    </div>
  );
}