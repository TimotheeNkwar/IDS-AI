import { create } from "zustand";
import type { RiskSignal, TopFeature } from "../types/types";

interface AlertPayload {
  src_ip: string;
  dst_ip: string;
  timestamp: string;
  protocol: string;
  service: string;
  ml_label: string;
  ml_confidence: number;
  ml_model: string;
  llm_severity: string | null;
  llm_confidence: number;
  risk_signals: RiskSignal[];
  top_features: TopFeature[];
  knowledge_matches: string[];
  classification: string;
  severity: string;
  attack_type: string | null;
  confidence: number;
  explanation: string;
  recommended_action: string;
  needs_review: boolean;
  evidence: string[];
}

interface MetaPayload {
  proto: string;
  service: string;
  src_ip: string;
  dst_ip: string;
}

interface DashboardUpdate {
  type: "dashboard_update";
  timestamp: string;
  is_anomaly: boolean;
  meta: MetaPayload;
  alert: AlertPayload | null;
}

interface WsStore {
  // State
  isConnected: boolean;
  lastUpdate: DashboardUpdate | null;
  alertCount: number;
  liveAlerts: AlertPayload[];
  liveTraffic: MetaPayload[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  reset: () => void;
}

export const useWsStore = create<WsStore>((set, get) => {
  let socket: WebSocket | null = null;

  return {
    // ── State ──────────────────────────────
    isConnected: false,
    lastUpdate: null,
    alertCount: 0,
    liveAlerts: [],
    liveTraffic: [],

    // ── Actions ────────────────────────────
    connect: () => {
      if (socket?.readyState === WebSocket.OPEN) return; // Avoid multiple connections

      socket = new WebSocket("ws://localhost:8000/api/ws/alerts");

      socket.onopen = () => {
        set({ isConnected: true });
      };

      socket.onmessage = (e) => {
        console.log("WS:", e.data);
        const data: DashboardUpdate = JSON.parse(e.data);

        const alert = data.alert;
        if (alert) {
          // ← we want to keep the latest 50 alerts and 100 traffic records in memory
          set((state) => ({
            lastUpdate: data,
            alertCount: state.alertCount + 1,
            liveAlerts: [alert, ...state.liveAlerts].slice(0, 50),
          }));
        } else {
          set((state) => ({
            lastUpdate: data,
            liveTraffic: [data.meta, ...state.liveTraffic].slice(0, 100),
          }));
        }
      };

      socket.onclose = () => {
        set({ isConnected: false });
        // Automatic reconnection after 3s
        setTimeout(() => get().connect(), 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    },

    disconnect: () => {
      socket?.close();
      socket = null;
      set({ isConnected: false });
    },

    reset: () => {
      set({ alertCount: 0, liveAlerts: [], liveTraffic: [] });
    },
  };
});
