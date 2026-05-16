import type { Alert } from "../../../../types/types";
export default function RiskSignals({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4 border-b border-base-content/12 pb-4">
      <div className="flex items-center justify-between  text-gray-400 uppercase font-semibold mb-1 gap-2">
        <h3 className="">Risk Signals</h3>
        <h3>Evidence</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
        {/* Risk signals — jaune */}
        <div className="bg-yellow-900 p-3 rounded-lg">
          {alert?.risk_signals?.length ? (
            alert.risk_signals.map((signal, i) => (
              <div key={i}>
                <p className="text-yellow-200">
                  {signal.name.replace(/_/g, " ")}
                </p>
                <p className="text-gray-300 font-normal">{signal.evidence}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">N/A</p>
          )}
        </div>

        <div className="bg-slate-800 p-3 rounded-lg border-l-2 border-red-500 flex flex-col gap-2">
          {alert?.evidence?.length ? (
            alert.evidence.map((e, i) => (
              <p key={i} className="text-gray-200 font-normal">
                {e}
              </p>
            ))
          ) : (
            <p className="text-gray-400">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
}
