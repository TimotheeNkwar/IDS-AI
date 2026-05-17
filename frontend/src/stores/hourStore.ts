import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  hours: number;
  setHours: (hours: number) => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      hours: 24,
      setHours: (hours) => set({ hours }),
    }),
    {
      name: "app-store", // key in localStorage
    },
  ),
);

export default useAppStore;
