import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "../types/types";

export const useThemeStore = create(
  persist<{ theme: Theme; setTheme: (t: Theme) => void }>(
    (set) => ({ theme: "dark", setTheme: (theme) => set({ theme }) }),
    { name: "theme-storage" },
  ),
);
