import { forwardRef } from "react";
import type { Alert } from "../../../types/types";
import { useThemeStore } from "../../../stores/themeStore";

import ModalHeader from "./modal/ModalHeader";
import Message from "./modal/Message";
import NetworkInfo from "./modal/NetworkInfo";
import ConfidenceInfo from "./modal/ConfidenceInfo";
import RiskSignals from "./modal/RiskSignals";
import TopFeatures from "./modal/TopFeatures";
import KnowledgeMatches from "./modal/KnowledgeMatches";
import RecommendedAction from "./modal/RecommendedAction";

const ThreatModal = forwardRef<HTMLDialogElement, { alert: Alert | null }>(
  ({ alert }, ref) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    // ── Tokens ───────────────────────────────────────────────────────────────
    const t = {
      backdrop: isDark
        ? "bg-black/60 backdrop-blur-md"
        : "bg-black/30 backdrop-blur-sm",
      box: isDark
        ? "bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/40"
        : "bg-white border-slate-200 shadow-xl shadow-slate-200/60",
      stickyHeader: isDark
        ? "bg-slate-900/80 backdrop-blur-xl border-slate-800/60"
        : "bg-white/90 backdrop-blur-sm border-slate-200",
      scrollbar: isDark
        ? "scrollbar-thumb-slate-700 scrollbar-track-transparent"
        : "scrollbar-thumb-slate-300 scrollbar-track-transparent",
    };

    return (
      <dialog ref={ref} className={`modal ${t.backdrop}`}>
        <div
          className={`
            modal-box border rounded-2xl p-0
            flex flex-col max-w-4xl max-h-[90vh]
            ${t.box}
          `}
        >
          {/* HEADER (sticky glass) */}
          <div
            className={`
              sticky top-0 z-10
              px-6 pt-6 pb-4
              border-b rounded-t-2xl
              ${t.stickyHeader}
            `}
          >
            <ModalHeader alert={alert} />
          </div>

          {/* CONTENT */}
          <div
            className={`
              overflow-y-auto px-6 pb-6
              flex flex-col gap-4
              scrollbar-thin ${t.scrollbar}
            `}
          >
            <Message alert={alert} />
            <NetworkInfo alert={alert} />
            <ConfidenceInfo alert={alert} />
            <RiskSignals alert={alert} />
            <TopFeatures alert={alert} />
            <KnowledgeMatches alert={alert} />
            <RecommendedAction alert={alert} />
          </div>
        </div>
      </dialog>
    );
  },
);

export default ThreatModal;
