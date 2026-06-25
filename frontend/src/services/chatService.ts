import { useAuthStore } from "@/store/authStore";
import type { ChatRequest, ChatResponse } from "@/types/chat";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function askAI(
  token: string | null,
  message: string,
  previousResponseId?: string,
): Promise<ChatResponse> {
  try {
    const requestBody: ChatRequest = {
      message,
      ...(previousResponseId && { previousResponseId }),
    };

    // Wyślij POST request do backendu
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Sprawdź czy response jest OK (status 200-299)
    if (!response.ok) {
      if (response.status === 401) {
        // Wyloguj z aplikacji po wygaśnięciu tokena zgodnie z TOKEN_EXPIRES_IN
        useAuthStore.getState().setAuthLogout();
        window.location.href = "/login.html";
      }

      const errorData = await response
        .json()
        .catch(() => ({ error: "Nieznany błąd" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }
    // Parsuj JSON response
    const answerAI: ChatResponse = await response.json();
    return answerAI;
  } catch (error) {
    console.error("[chatService] błąd:", error);

    // Sprawdź typ błędu i rzuć user-friendly message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Nie można połączyć z serwerem. Sprawdź czy backend działa.",
        { cause: error },
      );
    }
    throw new Error("Wystąpił nieoczekiwany błąd.", { cause: error });
  }
}
