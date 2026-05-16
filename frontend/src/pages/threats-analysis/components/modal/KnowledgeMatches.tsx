import type { Alert } from "../../../../types/types";
export default function KnowledgeMatches({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 mb-4">
      <h3 className="text-gray-400 uppercase font-semibold text-xs mb-2">
        Knowledge matches
      </h3>
      <div className="flex flex-wrap gap-2">
        {alert?.knowledge_matches?.length ? (
          alert.knowledge_matches.map((k, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300 border border-slate-600"
            >
              {k}
            </span>
          ))
        ) : (
          <p className="text-gray-400 text-sm">N/A</p>
        )}
      </div>
    </div>
  );
}
