import type {
  AuthResponseError,
  AuthResponseSuccess,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function userAuth(
  path: string,
  body: LoginRequest | RegisterRequest,
): Promise<AuthResponseSuccess | AuthResponseError> {
  try {
    // Wyślij POST request do backendu
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Sprawdź czy response jest OK (status 200-299)
    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      const message =
        typeof errorData?.error === "string" &&
        errorData.error.trim().length > 0
          ? errorData.error
          : `HTTP ${response.status}: ${response.statusText}`;

      throw new Error(message);
    }

    // Parsuj JSON response
    const data = await response.json();
    return data as AuthResponseSuccess;
  } catch (error) {
    console.error("[authService] błąd:", error);

    // Zachowaj szczegółowy komunikat z backendu, jeśli został już rzucony.
    if (error instanceof Error) {
      throw error;
    }

    // W przypadku problemu z siecią pokaż bardziej przyjazną informację.
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Nie można połączyć z serwerem. Sprawdź czy backend działa.",
        { cause: error },
      );
    }

    throw new Error("Wystąpił nieoczekiwany błąd.", { cause: error });
  }
}

export async function userRegister(payload: RegisterRequest) {
  return userAuth("/api/auth/register", payload);
}

export async function userLogin(payload: LoginRequest) {
  return userAuth("/api/auth/login", payload);
}
