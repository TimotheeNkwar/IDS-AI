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
      <dialog ref={ref} className="modal bg-slate-950/80 backdrop-blur-sm">
        <div className="modal-box bg-slate-800/90 border border-base-content/5 max-w-4xl rounded-2xl p-0 flex flex-col max-h-[90vh]">
          {/* Header fixe — pas de scroll */}
          <div className="sticky top-0 z-10 bg-slate-800 px-6 pt-6 pb-4 rounded-t-2xl border-b border-base-content/12">
            <ModalHeader alert={alert} />
          </div>

          {/* Contenu scrollable */}
          <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-4">
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
