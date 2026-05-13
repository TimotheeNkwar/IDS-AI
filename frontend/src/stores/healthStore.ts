import { create } from "zustand";
import { healthService } from "../services/healthService";

// ── Types ──────────────────────────────────────────────────────
interface HealthStore {
  status: string;
  timestamp: string;
  ml_model: string | null;
  ml_model_loaded: boolean;
  ml_f1: number | null;
  llm_model: string;
  llm_provider: string;
  llm_loaded: boolean;
  llm_enabled: boolean;
  alert_storage_enabled: boolean;
  alert_storage_connected: boolean;
  traffic_storage_connected: boolean;
  stats_storage_connected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHealth: () => Promise<void>;
}

// ── Initial state ──────────────────────────────────────────────
const initialState = {
  status: "unknown",
  timestamp: "",
  ml_model: null,
  ml_model_loaded: false,
  ml_f1: null,
  llm_model: "",
  llm_provider: "",
  llm_loaded: false,
  llm_enabled: false,
  alert_storage_enabled: false,
  alert_storage_connected: false,
  traffic_storage_connected: false,
  stats_storage_connected: false,
  isLoading: false,
  error: null,
};

// ── Store ──────────────────────────────────────────────────────
export const useHealthStore = create<HealthStore>((set) => ({
  ...initialState,

  fetchHealth: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await healthService.checkHealth();
      set({ ...res.data, isLoading: false });
    } catch (err: any) {
      set({ status: "unreachable", error: err.message, isLoading: false });
    }
  },
}));
