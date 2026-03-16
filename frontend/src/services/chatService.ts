import type { ChatRequest, ChatResponse } from "@/types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * NOTE: Wysyła wiadomość do backend API
 * @param message - Wiadomość użytkownika
 * @param previousResponseId - ID poprzedniej odpowiedzi (dla kontynuacji rozmowy)
 * @returns Odpowiedź AI z ID i timestampem
 */

export async function askAI(
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Sprawdź czy response jest OK (status 200-299)
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
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

    throw error;
  }
}
