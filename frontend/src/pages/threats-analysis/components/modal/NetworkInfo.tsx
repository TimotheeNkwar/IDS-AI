import type { Alert } from "../../../../types/types";
export default function NetworkInfo({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4 border-b border-base-content/12 pb-4">
      <h3 className="text-gray-400 uppercase font-semibold mb-1">NETWORK</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Source IP</p>
          <p className="text-sm ">{alert?.source_ip}</p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Destination IP</p>
          <p className="text-sm ">{alert?.destination_ip}</p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Classification</p>
          <p className="text-sm font-semibold">{alert?.classification}</p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Need Review</p>
          <p
            className={`${alert?.needs_manual_review ? "text-green-400" : "text-yellow-400"} text-sm font-semibold`}
          >
            {alert?.needs_manual_review ? "Yes" : "No"}
          </p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Source Port</p>
          <p className="text-sm ">{alert?.source_port || "N/A"}</p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Destination Port</p>
          <p className="text-sm ">{alert?.destination_port || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}
