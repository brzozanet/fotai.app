export function WorkInProgressPage() {
  return (
    <div className="info-page relative isolate mx-auto w-full max-w-5xl rounded-3xl px-4 py-5 md:px-0">
      <div
        aria-hidden="true"
        className="pointer-events-none inset -inset-x-4 inset-y-0 -z-10 rounded-3xl bg-black/65 backdrop-blur-2xl md:-inset-x-6"
      />
      <div className="relative z-10">
        <h2 className="mb-10 mt-10 text-5xl leading-15 font-semibold text-white">
          Nad czym pracuję dalej?
        </h2>

        <p className="mb-4">
          <strong>FOTAI</strong> już pomaga odpowiadać na pytania fotograficzne,
          ale chcę, żeby był jeszcze wygodniejszy i bardziej przydatny w
          codziennym życiu.
        </p>

        <h3 className="mb-4 mt-6 text-2xl font-semibold text-white">
          Co jest już w drodze
        </h3>

        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <strong>Wiele rozmów naraz</strong> — każdą tematykę będziesz mógł
            prowadzić w osobnej rozmowie.
          </li>
          <li>
            <strong>Historia rozmów na różnych urządzeniach</strong> — wrócisz
            do wcześniejszych pytań także na telefonie czy tablecie.
          </li>
          <li>
            <strong>Odpowiedzi pojawiające się na bieżąco</strong> — asystent
            będzie odpowiadał bardziej naturalnie, tak jak w popularnych czatach
            AI.
          </li>
          <li>
            <strong>Lepsze konto użytkownika</strong> — zmiana danych, większa
            kontrola nad ustawieniami i wygodniejsze korzystanie z aplikacji.
          </li>
        </ul>

        <h3 className="mb-4 mt-6 text-2xl font-semibold text-white">
          Co chcę dodać potem
        </h3>

        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <strong>Opinie o własnych zdjęciach</strong> — wrzucisz zdjęcie i
            FOTAI powie, co jest dobrze, a co można poprawić.
          </li>
          <li>
            <strong>Proste edytowanie zdjęć tekstem</strong> — na przykład
            „dodaj więcej chmur” albo „usuń element z tła”.
          </li>
        </ul>

        <h3 className="mb-4 mt-6 text-2xl font-semibold text-white">
          Jeszcze dalej w planach
        </h3>

        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>Wspólna galeria zdjęć i możliwość dzielenia się pracami.</li>
          <li>Wersja aplikacji bardziej przyjazna na telefon.</li>
          <li>
            Jeszcze prostsze i bardziej intuicyjne funkcje dla każdego
            użytkownika.
          </li>
        </ul>

        <p className="mb-4">
          Każda nowa funkcja powstaje powoli, żeby była naprawdę przydatna i
          działała dobrze.
        </p>

        <p>
          Jeśli chcesz śledzić postęp, wracaj tu czasem — ta strona będzie
          aktualizowana wraz z rozwojem FOTAI.
        </p>
      </div>
    </div>
  );
}
