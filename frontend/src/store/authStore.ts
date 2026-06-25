import type { AuthState } from "@/types/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChatStore } from "./chatStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuthLogin: (user, token) => {
        useChatStore.getState().setError(false);
        set({ user, token, isAuthenticated: true });
      },
      setAuthLogout: () => {
        useChatStore.getState().setError(false);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "fotai-auth-storage" }, // klucz w localStorage
  ),
);
