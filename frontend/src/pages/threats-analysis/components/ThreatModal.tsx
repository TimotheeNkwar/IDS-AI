// ThreatModal.tsx
import { forwardRef } from "react";
import type { Alert } from "../../../types/types";

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
    return (
      <dialog
        ref={ref}
        className="
          modal
          bg-black/60
          backdrop-blur-md
        "
      >
        <div
          className="
            modal-box
            bg-slate-900/70
            backdrop-blur-xl
            border border-slate-700/50
            shadow-2xl shadow-black/40
            max-w-4xl
            rounded-2xl
            p-0
            flex flex-col
            max-h-[90vh]
          "
        >
          {/* HEADER (sticky glass) */}
          <div
            className="
              sticky top-0 z-10
              bg-slate-900/80
              backdrop-blur-xl
              px-6 pt-6 pb-4
              border-b border-slate-800/60
              rounded-t-2xl
            "
          >
            <ModalHeader alert={alert} />
          </div>

          {/* CONTENT */}
          <div
            className="
              overflow-y-auto
              px-6 pb-6
              flex flex-col gap-4
              scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent
            "
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
