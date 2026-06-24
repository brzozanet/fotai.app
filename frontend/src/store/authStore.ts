import type { AuthState } from "@/types/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuthLogin: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      setAuthLogout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "fotai-auth-storage" }, // klucz w localStorage
  ),
);
