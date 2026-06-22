import { Turnstile, useTurnstile } from "react-turnstile";

const TURNSTILE_SITE_KEY: string =
  import.meta.env.TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export function TurnstileWidget() {
  const turnstile = useTurnstile();

  return (
    <>
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        theme="light"
        language="pl"
        fixedSize={true}
        onVerify={(token) => {
          fetch("/register.html", {
            method: "POST",
            body: JSON.stringify({ token }),
          }).then((response) => {
            if (!response.ok) turnstile.reset();
          });
        }}
      />
    </>
  );
}
