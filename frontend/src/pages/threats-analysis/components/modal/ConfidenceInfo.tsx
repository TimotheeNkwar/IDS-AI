import type { Alert } from "../../../../types/types";
export default function ConfidenceInfo({ alert }: { alert: Alert | null }) {
  const format_confidence = (v: number) => {
    return `${Math.round(v * 100)}%`;
  };
  return (
    <div>
      <h3 className="text-gray-400 uppercase font-semibold mb-1">
        Confidence scores
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center font-semibold">
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">ML</p>
          <p className="text-sm ">
            {format_confidence(alert?.ml_confidence ?? 0)}
          </p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">LLM</p>
          <p className="text-sm ">
            {format_confidence(alert?.llm_confidence ?? 0)}
          </p>
        </div>
        <div className="flex flex-col bg-slate-900 p-3 rounded-lg">
          <p className="text-xs">Final Confidence</p>
          <p className="text-sm ">
            {format_confidence(alert?.final_confidence ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
