import { Turnstile, useTurnstile } from "react-turnstile";

const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export function TurnstileWidget({ onVerify, onReset }) {
  const turnstile = useTurnstile();

  return (
    <Turnstile
      sitekey={TURNSTILE_SITE_KEY}
      theme="light"
      language="pl"
      fixedSize={true}
      onVerify={(token) => {
        // Turnstile powiedział "OK, to jest człowiek", więc dostałeś token.
        // Ten token potem wysyłasz do backendu, żeby był naprawdę zweryfikowany.
        onVerify(token);
      }}
      onExpire={() => {
        // Token wygasł. Trzeba zrobić nową próbę i pobrać nowy token.
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
