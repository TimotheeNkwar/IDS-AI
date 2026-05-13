import { create } from "zustand";
import { trafficService } from "../services/trafficService";
import type { TrafficRecord } from "../types/types";

const MAX_RECORDS = 100;

interface TrafficStore {
  trafficData: TrafficRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTraffic: () => Promise<void>;
  addTrafficRecord: (record: TrafficRecord) => void; // ← WebSocket
  clearTrafficData: () => void;
}

export const useTrafficStore = create<TrafficStore>((set) => ({
  trafficData: [],
  isLoading: false,
  error: null,

  fetchTraffic: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await trafficService.fetchTrafficData();
      set({ trafficData: data.traffic, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // This will be called by the WebSocket listener in wsStore when a new traffic record is received
  addTrafficRecord: (record) =>
    set((state) => ({
      trafficData: [record, ...state.trafficData].slice(0, MAX_RECORDS),
    })),

  clearTrafficData: () => set({ trafficData: [] }),
}));
