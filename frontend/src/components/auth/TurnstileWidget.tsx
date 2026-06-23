import { Turnstile, useTurnstile } from "react-turnstile";

const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export function TurnstileWidget(path: string) {
  const turnstile = useTurnstile();

  return (
    <>
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        theme="light"
        language="pl"
        fixedSize={true}
        onVerify={(token) => {
          // Turnstile powiedział "OK, to jest człowiek", więc dostaliśmy token.
          // Ten token możemy potem wysłać do backendu, żeby potwierdzić rejestrację.
          fetch(path, {
            method: "POST",
            body: JSON.stringify({ token }),
          }).then((response) => {
            // Jeśli serwer odpowie błędem, to znaczy, że token nie przeszedł walidacji.
            // Wtedy resetujemy widget, żeby użytkownik mógł spróbować jeszcze raz.
            if (!response.ok) turnstile.reset();
          });
        }}
        onExpire={() => {
          // Token ma ograniczony czas życia, jak bilet wejściowy.
          // Gdy się skończy, trzeba go odświeżyć i zrobić nową próbę.
          turnstile.reset();
        }}
        onError={() => {
          // Jeśli widget się zepsuje albo nie da rady wygenerować tokena,
          // to też resetujemy go, żeby użytkownik miał szansę spróbować ponownie.
          turnstile.reset();
        }}
      />
    </>
  );
}
