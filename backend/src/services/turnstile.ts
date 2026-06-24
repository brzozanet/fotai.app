import dotenv from "dotenv";
dotenv.config();

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export async function verifyTurnstileToken(token: string, action: string) {
  if (!TURNSTILE_SECRET_KEY) {
    throw new Error("Brak TURNSTILE_SECRET_KEY w środowisku");
  }

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
        // remoteip: request.ip, // opcjonalnie
      }),
    },
  );

  const data = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
    action: string;
  };

  if (!data.success) {
    return {
      ok: false,
      reason: data["error-codes"]?.join(", ") ?? "turnstile failed",
    };
  }

  if (action && data.action && data.action !== action) {
    return {
      ok: false,
      reason: "action mismatch",
    };
  }

  return { ok: true };
}
