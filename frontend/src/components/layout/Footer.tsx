export function Footer() {
  return (
    <>
      <footer className="relative z-10 border-t border-border/30 bg-card/30 py-4 text-center backdrop-blur-xl">
        <p className="text-muted-foreground">
          Asystent AI może popełniać błędy. Sprawdź ważne informacje.
        </p>
        <p className="text-foreground">
          Made with ❤️ by{" "}
          <a
            className="cursor-pointer font-bold text-primary hover:text-primary/80"
            href="https://brzoza.net"
            target="_blank"
            rel="noreferrer"
          >
            brzoza.net
          </a>
        </p>
      </footer>
    </>
  );
}
