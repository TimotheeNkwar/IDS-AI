import type { Alert } from "../../../../types/types";
export default function RecommendedAction({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4 bg-yellow-900/40 border-l-2 border-yellow-500 p-3 rounded-lg">
      <h3 className="text-yellow-400 uppercase font-semibold text-xs mb-1">
        Recommended action
      </h3>
      <p className="text-sm text-gray-200">
        {alert?.recommended_action || "N/A"}
      </p>
    </div>
  );
}
