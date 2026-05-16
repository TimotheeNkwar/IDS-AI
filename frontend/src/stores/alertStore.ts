// alertStore.ts
import { create } from "zustand";
import type { Alert } from "../types/types";
import { alertService } from "../services/alertService";

interface AlertStore {
  alerts: Alert[];
  selected: Alert | null;
  isLoading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  setSelected: (alert: Alert | null) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  selected: null,
  isLoading: false,
  error: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await alertService.fetchAlerts();
      set({ alerts: data.alerts, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  fetchAlert: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await alertService.fetchAlert(id);
      set({ selected: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setSelected: (alert) => set({ selected: alert }),
}));
