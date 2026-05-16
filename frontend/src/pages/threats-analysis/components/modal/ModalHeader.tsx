import { ShieldAlert, ShieldBan, ShieldX, TrafficCone } from "lucide-react";
import type { Alert } from "../../../../types/types";
export default function ModalHeader({ alert }: { alert: Alert | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg flex items-center bg-red-900 p-2 rounded-lg">
          {alert?.severity === "medium" && (
            <ShieldAlert className="w-6 h-6 text-yellow-500" />
          )}

          {alert?.severity === "high" && (
            <ShieldBan className="w-6 h-6 text-red-600" />
          )}
        </h3>
        <div className="flex flex-col justify-center ">
          <div className="flex space-x-1 text-xs items-center">
            <p>{alert?.type}</p>
            <p
              className={`font-semibold p-0.5 px-1.5 rounded-2xl ${alert?.severity === "medium" ? "text-yellow-800 bg-yellow-500 " : "text-red-300 bg-red-900 "}`}
            >
              {alert?.severity}
            </p>
            <p
              className={`font-semibold p-0.5 px-2 rounded-2xl ${alert?.status === "open" ? "text-green-300 bg-green-900" : "text-red-300 bg-red-900"}`}
            >
              {alert?.status}
            </p>
          </div>
          <div className="flex space-x-1 items-center text-base-content/60 text-xs">
            <p className="">
              {new Date(alert?.timestamp ?? "").toLocaleString()}.
            </p>
            <p>ID:{alert?.id}</p>
          </div>
        </div>
      </div>

      <form method="dialog">
        <button className="btn btn-sm btn-circle btn-ghost">✕</button>
      </form>
    </div>
  );
}
