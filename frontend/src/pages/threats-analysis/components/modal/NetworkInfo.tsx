import type { Alert } from "../../../../types/types";

export default function NetworkInfo({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4 pb-4 border-b border-slate-800/50">

      {/* TITLE */}
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        Network
      </h3>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        {[
          { label: "Source IP", value: alert?.source_ip },
          { label: "Destination IP", value: alert?.destination_ip },
          { label: "Classification", value: alert?.classification },
          {
            label: "Needs Review",
            value: alert?.needs_manual_review ? "Yes" : "No",
            highlight: alert?.needs_manual_review ? "text-green-400" : "text-yellow-400",
          },
          { label: "Source Port", value: alert?.source_port || "N/A" },
          { label: "Destination Port", value: alert?.destination_port || "N/A" },
        ].map((item) => (
          <div
            key={item.label}
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
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
              {item.label}
            </p>

            <p
              className={`
                text-sm font-medium text-slate-200
                ${item.highlight ?? ""}
              `}
            >
              {item.value}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}