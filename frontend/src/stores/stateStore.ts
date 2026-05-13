import { create } from "zustand";
import { statsService } from "../services/statsService";

// ── Types ──────────────────────────────────────────────────────

interface CountById {
  _id: string;
  count: number;
}

interface TotalById {
  _id: string;
  total: number;
}

interface TimeSeriesPoint {
  _id: { year: number; month: number; day: number; hour: number };
  count: number;
}

interface Anomaly {
  _id: string;
  count: number;
}

interface StatsStore {
  // Alert stats
  attacks_by_type: CountById[];
  attacks_by_severity: CountById[];
  attacks_by_status: CountById[];
  alerts_over_time: TimeSeriesPoint[];
  top_attacker_ips: CountById[];

  // Traffic stats
  traffic_by_protocol: TotalById[];
  traffic_by_service: TotalById[];
  traffic_over_time: TimeSeriesPoint[];
  top_talker_ips: TotalById[];

  // Traffic summary
  period_hours: number;
  normal: number;
  anomalies: Anomaly[];
  total: number;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStats: (hours?: number) => Promise<void>;
  fetchAlertStats: (hours?: number) => Promise<void>;
  fetchTrafficStats: (hours?: number) => Promise<void>;
  fetchTrafficSummary: (hours?: number) => Promise<void>;
  fetchAll: (hours?: number) => Promise<void>;
}

// ── Initial state ───────────────────────────────────────────────

const initialState = {
  attacks_by_type: [],
  attacks_by_severity: [],
  attacks_by_status: [],
  alerts_over_time: [],
  top_attacker_ips: [],
  traffic_by_protocol: [],
  traffic_by_service: [],
  traffic_over_time: [],
  top_talker_ips: [],
  period_hours: 24,
  normal: 0,
  anomalies: [],
  total: 0,
  isLoading: false,
  error: null,
};

// ── Helpers ─────────────────────────────────────────────────────

const setError = (err: unknown): string =>
  err instanceof Error ? err.message : "Unknown error";

// ── Store ────────────────────────────────────────────────────────

export const useStatsStore = create<StatsStore>((set, get) => ({
  ...initialState,

  fetchStats: async (hours = 24) => {
    try {
      const response = await statsService.fetchStats(hours);
      console.log("response.data:", response.data);
      set({ ...response.data });
    } catch (err) {
      set({ error: setError(err) });
    }
  },

  fetchAlertStats: async (hours = 24) => {
    try {
      const { data } = await statsService.fetchAlertStats(hours);
      set({
        attacks_by_type: data.by_type,
        attacks_by_severity: data.by_severity,
        attacks_by_status: data.by_status,
        alerts_over_time: data.over_time,
        top_attacker_ips: data.top_ips,
      });
    } catch (err) {
      set({ error: setError(err) });
    }
  },

  fetchTrafficStats: async (hours = 24) => {
    try {
      const { data } = await statsService.fetchTrafficStats(hours);
      set({
        traffic_by_protocol: data.by_protocol,
        traffic_by_service: data.by_service,
        traffic_over_time: data.over_time,
        top_talker_ips: data.top_ips,
      });
    } catch (err) {
      set({ error: setError(err) });
    }
  },

  fetchTrafficSummary: async (hours = 24) => {
    try {
      const { data } = await statsService.fetchTrafficSummary(hours);
      set({
        period_hours: data.period_hours,
        normal: data.normal,
        anomalies: data.anomalies,
        total: data.total,
      });
    } catch (err) {
      set({ error: setError(err) });
    }
  },

  //is Loading should be set to true at the beginning of each fetch and false at the end of all fetches?
  fetchAll: async (hours = 24) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchStats(hours),
        get().fetchTrafficSummary(hours),
      ]);
    } catch (err) {
      set({ error: setError(err) });
    } finally {
      set({ isLoading: false }); // Set loading to false after all fetches complete, regardless of success or failure
    }
  },
}));
