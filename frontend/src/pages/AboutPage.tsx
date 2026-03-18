export function AboutPage() {
  return (
    <>
      <div className="info-page mx-auto mb-10 w-full max-w-5xl px-4 py-5 md:px-0">
        <h2 className="material-title mb-10 mt-10 text-5xl font-semibold">
          O projekcie FOTAI
        </h2>
        <p className="mb-4">
          FOTAI powstało na styku dwóch pasji:{" "}
          <strong>programowania i fotografii</strong>. Z jednej strony to
          projekt <strong>portfolio programisty</strong>, z drugiej — realne
          narzędzie wspierające i promujące{" "}
          <strong>autorskie warsztaty fotograficzne</strong>.
        </p>

        <p className="mb-4">
          Pomysł narodził się z bardzo prostego problemu: fotografowie — zarówno
          początkujący, jak i bardziej zaawansowani — często potrzebują{" "}
          <strong>szybkiej i sensownej porady</strong>, bez przekopywania się
          przez fora, przypadkowe tutoriale czy sprzeczne opinie.
        </p>

        <p className="mb-4">
          FOTAI ma być odpowiednikiem rozmowy z instruktorem: konkretnie, na
          temat i z myślą o praktycznym wykorzystaniu w terenie.
        </p>

        <p className="mb-4">
          🔗{" "}
          <a
            className="font-semibold text-primary underline"
            href="https://github.com/brzozanet/fotai.app"
            target="_blank"
          >
            Repozytorium na GitHub
          </a>
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Połączenie technologii i fotografii
        </h3>

        <p>Projekt jest świadomym połączeniem:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>pasji do tworzenia nowoczesnych aplikacji webowych,</li>
          <li>doświadczenia w fotografii i prowadzeniu warsztatów,</li>
          <li>
            wykorzystania AI jako realnego narzędzia, a nie marketingowego
            buzzwordu.
          </li>
        </ul>

        <p>Asystent został zaprojektowany tak, aby:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>odpowiadać jak instruktor fotografii,</li>
          <li>tłumaczyć „dlaczego”, a nie tylko „jak”,</li>
          <li>
            wspierać rozwój fotografa — od pierwszych kroków po bardziej
            zaawansowane techniki.
          </li>
        </ul>

        <p>
          Jednocześnie aplikacja pełni rolę{" "}
          <strong>
            platformy promującej autorskie warsztaty fotograficzne
          </strong>
          , pokazując w praktyce podejście do nauki i filozofię pracy z
          uczestnikami.
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Projekt portfolio z realnym zastosowaniem
        </h3>

        <p>
          FOTAI nie jest projektem „do szuflady”. To pełnoprawna aplikacja
          webowa, która demonstruje umiejętności z zakresu:
        </p>

        <ul className="mb-4 list-disc pl-8">
          <li>projektowania architektury aplikacji,</li>
          <li>integracji z API AI,</li>
          <li>pracy z nowoczesnym frontendem i backendem,</li>
          <li>dbania o UX, wydajność i czytelność interfejsu.</li>
        </ul>

        <p>
          Projekt został zaplanowany i zrealizowany jak realny produkt — od
          koncepcji, przez UI, po deployment.
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Stack technologiczny
        </h3>

        <h4>Frontend</h4>
        <ul className="mb-4 list-disc pl-8">
          <li>React</li>
          <li>TypeScript</li>
          <li>Vite</li>
          <li>Tailwind CSS</li>
          <li>shadcn/ui</li>
          <li>Zustand (zarządzanie stanem)</li>
          <li>UI/UX focused design</li>
        </ul>

        <h4>Backend</h4>
        <ul className="mb-4 list-disc pl-8">
          <li>Node.js + Express.js</li>
          <li>Integracja z OpenAI API</li>
          <li>Warstwa API oddzielona od frontendu</li>
        </ul>

        <h4>Deployment</h4>
        <ul className="mb-4 list-disc pl-8">
          <li>Vercel — frontend</li>
          <li>Render — backend</li>
        </ul>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Dlaczego ten projekt?
        </h3>

        <p>Bo najlepsze projekty powstają wtedy, gdy:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>technologia spotyka się z realnym doświadczeniem,</li>
          <li>kod rozwiązuje prawdziwe problemy,</li>
          <li>a nauka i rozwój mają praktyczny sens.</li>
        </ul>

        <p>
          FOTAI to połączenie <strong>programowania, fotografii i AI</strong> w
          formie, która działa — zarówno jako projekt portfolio, jak i narzędzie
          wspierające fotografów oraz warsztaty fotograficzne.
        </p>
      </div>
    </>
  );
}
