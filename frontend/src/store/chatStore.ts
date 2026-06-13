import type { ChatState } from "@/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: false,

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      clearMessages: () => set({ messages: [], error: false }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
    }),
    { name: "fotai-chat-storage" }, // klucz w localStorage
  ),
);
