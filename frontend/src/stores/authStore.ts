import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User) => void;
  setTokens: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken) => set({ accessToken }),

      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: "auth-storage" },
  ),
);
