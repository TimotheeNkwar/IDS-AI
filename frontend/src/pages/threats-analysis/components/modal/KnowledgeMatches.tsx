import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function KnowledgeMatches({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const t = {
    sectionLabel: isDark ? "text-slate-500" : "text-slate-400",
    empty: isDark ? "text-slate-500" : "text-slate-400",
    tag: isDark
      ? "bg-slate-900/40 backdrop-blur-md border-slate-700/40 text-slate-300 hover:border-fuchsia-500/40 hover:text-white"
      : "bg-violet-50 border-violet-200 text-violet-700 hover:border-violet-400 hover:text-violet-900",
  };

  return (
    <div className="mt-4">
      <h3
        className={`text-xs uppercase tracking-widest font-semibold mb-3 ${t.sectionLabel}`}
      >
        Knowledge Matches
      </h3>

      {!alert?.knowledge_matches?.length ? (
        <p className={`text-xs ${t.empty}`}>No matches found</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {alert.knowledge_matches.map((k, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition ${t.tag}`}
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
