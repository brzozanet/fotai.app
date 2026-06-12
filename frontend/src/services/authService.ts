const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function userAuth(path: string, body: object) {
  try {
    // Wyślij POST request do backendu
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Sprawdź czy response jest OK (status 200-299)
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Nieznany błąd" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    // Parsuj JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[authService] błąd:", error);
  }
}

export function userRegister(email, name, password) {
  return userAuth("/api/auth/register", { email, name, password });
}

export function userLogin(email, password) {
  return userAuth("/api/auth/login", { email, password });
}
