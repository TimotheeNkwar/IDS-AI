import type { Alert } from "../../../../types/types";

export default function KnowledgeMatches({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4">

      {/* TITLE */}
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        Knowledge Matches
      </h3>

      {/* EMPTY */}
      {!alert?.knowledge_matches?.length ? (
        <p className="text-xs text-slate-500">No matches found</p>
      ) : (
        <div className="flex flex-wrap gap-2">

          {alert.knowledge_matches.map((k, i) => (
            <span
              key={i}
              className="
                px-2.5 py-1
                text-[11px]
                rounded-full
                bg-slate-900/40
                backdrop-blur-md
                border border-slate-700/40
                text-slate-300
                hover:border-fuchsia-500/40
                hover:text-white
                transition
              "
            >
              {k}
            </span>
          ))}

        </div>
      )}

    </div>
  );
}