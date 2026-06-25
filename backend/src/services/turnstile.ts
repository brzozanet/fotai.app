import dotenv from "dotenv";
dotenv.config();

const TURNSTILE_SECRET_KEY_TEST = "1x0000000000000000000000000000000AA";
const TURNSTILE_SECRET_KEY_PROD = process.env.TURNSTILE_SECRET_KEY;

const TURNSTILE_SECRET_KEY =
  process.env.NODE_ENV === "development"
    ? TURNSTILE_SECRET_KEY_TEST
    : TURNSTILE_SECRET_KEY_PROD;

export async function verifyTurnstileToken(token: string, action: string) {
  // Jeśli klient nie dostarczył tokena, od razu blokujemy request
  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      ok: false,
      reason: "Missing Turnstile token",
    };
  }

  // Jeśli nie przekazano akcji, nie możemy zweryfikować, czy token pasuje do właściwego formularza
  if (!action || typeof action !== "string" || !action.trim()) {
    return {
      ok: false,
      reason: "Missing Turnstile action",
    };
  }

  if (!TURNSTILE_SECRET_KEY) {
    throw new Error("Brak TURNSTILE_SECRET_KEY w środowisku");
  }

  // Wysyłamy token do Cloudflare, by sprawdził, czy jest prawidłowy i nie wygasł
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        // NOTE: opcjonalnie: można dodać IP użytkownika dla dodatkowej weryfikacji
        // remoteip: request.ip,
      }),
    },
  );

  // Odczytujemy odpowiedź od Cloudflare
  const data = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
    action: string;
  };

  console.log(data);

  // Jeśli Cloudflare uznał token za nieważny, zwracamy błąd z przyczyną
  if (!data.success) {
    return {
      ok: false,
      reason: data["error-codes"]?.join(", ") ?? "Turnstile failed",
    };
  }

  // Jeśli action został podany, sprawdzamy, czy token pasuje do oczekiwanej akcji
  if (action && data.action && data.action !== action) {
    return {
      ok: false,
      reason: "Action mismatch",
    };
  }

  // Jeśli wszystko przeszło poprawnie, token jest akceptowany
  return { ok: true };
}
