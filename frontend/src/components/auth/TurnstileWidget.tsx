import type { TurnstileWidgetProps } from "@/types/forms";
import { Turnstile, useTurnstile } from "react-turnstile";

// Podstawienie klucza TURNSTILE_SITE_KEY_TEST wyłącznie w środowisku developerskim
const TURNSTILE_SITE_KEY_TEST: string = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY: string = import.meta.env.DEV
  ? TURNSTILE_SITE_KEY_TEST
  : (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "");

if (!TURNSTILE_SITE_KEY) {
  throw new Error("Brak klucza Cloudflare Turnstile");
}

export function TurnstileWidget({
  action = "default",
  onVerify,
  onReset,
}: TurnstileWidgetProps) {
  const turnstile = useTurnstile();

  return (
    <Turnstile
      sitekey={TURNSTILE_SITE_KEY}
      action={action}
      theme="light"
      size="flexible"
      language="pl"
      fixedSize={true}
      onVerify={(token) => {
        // Turnstile powiedział "OK, to jest człowiek", więc dostałeś token
        // Ten token potem wysyłasz do backendu, żeby był naprawdę zweryfikowany
        onVerify(token);
      }}
      onExpire={() => {
        // Token wygasł. Trzeba zrobić nową próbę i pobrać nowy token
        turnstile.reset();
        onReset?.();
      }}
      onError={() => {
        // Jeśli widget się zepsuje, resetujemy go żeby użytkownik mógł spróbować jeszcze raz
        turnstile.reset();
        onReset?.();
      }}
    />
  );
}
