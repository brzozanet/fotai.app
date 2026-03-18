export function HowItWorksPage() {
  return (
    <>
      <div className="info-page mx-auto w-full max-w-5xl px-4 py-5 md:px-0">
        <h2 className="material-title mb-10 mt-10 text-5xl font-semibold">
          Jak działa FOTAI?
        </h2>
        <p className="mb-4">
          <strong>FOTAI</strong> to webowy asystent oparty o zaawansowany model
          językowy (LLM), który został{" "}
          <strong>
            specjalnie skonfigurowany do roli instruktora fotografii
          </strong>
          . To oznacza, że nie odpowiada „jak ogólny chatbot”, tylko myśli i
          doradza jak doświadczony fotograf-praktyk.
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Model AI wyszkolony w roli fotografa-instruktora
        </h3>

        <p>Sercem aplikacji jest model LLM, który:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>
            rozumie język naturalny (piszesz tak, jakbyś rozmawiał z
            człowiekiem),
          </li>
          <li>analizuje kontekst pytania,</li>
          <li>generuje odpowiedzi w sposób logiczny, spójny i zrozumiały.</li>
        </ul>

        <p className="mb-4">
          Kluczowe jest jednak to,{" "}
          <strong>jak ten model jest prowadzony</strong>. FOTAI działa w oparciu
          o <strong>system prompt</strong>, czyli zestaw precyzyjnych
          instrukcji, które nadają modelowi stałą rolę:
        </p>

        <blockquote className="material-surface relative mb-4 rounded-2xl pl-6 italic">
          <span className="absolute -left-4 -top-2 text-6xl leading-none text-primary/30">
            “
          </span>
          Odpowiadaj jak instruktor fotografii, mentor i praktyk.
          <br />
          Tłumacz prosto, ale merytorycznie. <br />
          Podawaj przykłady, wskazówki i możliwe warianty rozwiązań.
        </blockquote>

        <p>Dzięki temu odpowiedzi są:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>konkretne,</li>
          <li>oparte na realnej praktyce fotograficznej,</li>
          <li>
            dopasowane do poziomu użytkownika (od początkującego po
            zaawansowanego).
          </li>
        </ul>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Analiza pytania i kontekstu fotograficznego
        </h3>

        <p>Gdy zadasz pytanie, FOTAI:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>
            <strong>Analizuje treść zapytania</strong> – np. czy dotyczy
            techniki, kompozycji, sprzętu, obróbki czy konkretnego rodzaju
            fotografii.
          </li>
          <li>
            <strong>Rozpoznaje kontekst</strong> – światło, pora dnia, warunki,
            typ sceny, doświadczenie użytkownika.
          </li>
          <li>
            <strong>Dobiera styl odpowiedzi</strong> – krótka porada, lista
            kroków, wyjaśnienie „dlaczego”, albo praktyczne tipy z pleneru.
          </li>
        </ul>

        <p className="mb-4">
          <strong>Przykład:</strong>
        </p>

        <blockquote className="material-surface relative mb-4 rounded-2xl pl-6 italic">
          <span className="absolute -left-4 -top-2 text-6xl leading-none text-primary/30">
            “
          </span>
          Jak ustawić aparat do zdjęć nocnych w mieście?
        </blockquote>

        <p>Asystent nie poda tylko suchych parametrów, ale wyjaśni:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>dlaczego ISO powinno być niskie,</li>
          <li>kiedy statyw jest niezbędny,</li>
          <li>jak kontrolować światła i prześwietlenia,</li>
          <li>jakie błędy pojawiają się najczęściej.</li>
        </ul>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Odpowiedzi jak na warsztatach fotograficznych
        </h3>

        <p>
          FOTAI został zaprojektowany tak, aby{" "}
          <strong>symulować rozmowę z prowadzącym warsztaty</strong>:
        </p>

        <ul className="mb-4 list-disc pl-8">
          <li>tłumaczy krok po kroku,</li>
          <li>sugeruje alternatywy („jeśli nie masz statywu…”),</li>
          <li>zwraca uwagę na detale, które robią różnicę,</li>
          <li>podaje praktyczne przykłady z realnych sytuacji.</li>
        </ul>

        <p>
          Nie chodzi tylko o „jak”, ale też o{" "}
          <strong>„dlaczego warto zrobić to w ten sposób”</strong>.
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Specjalizacja w różnych dziedzinach fotografii
        </h3>

        <p>Asystent radzi m.in. w zakresie:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>fotografii krajobrazowej i podróżniczej,</li>
          <li>fotografii nocnej i astro,</li>
          <li>portretu i pracy z modelem,</li>
          <li>fotografii przyrody i wildlife,</li>
          <li>street photo,</li>
          <li>doboru sprzętu i akcesoriów,</li>
          <li>
            obróbki zdjęć (Lightroom, Photoshop – koncepcyjnie, nie magicznie).
          </li>
        </ul>

        <p>
          Każda odpowiedź jest tworzona{" "}
          <strong>
            z myślą o praktycznym zastosowaniu w terenie lub podczas obróbki
          </strong>
          .
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Bezpieczne i przewidywalne odpowiedzi
        </h3>

        <p>Dzięki system promptowi:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>
            asystent <strong>nie zgaduje</strong> i nie fantazjuje,
          </li>
          <li>jasno zaznacza, gdy coś zależy od sytuacji,</li>
          <li>proponuje kilka rozwiązań zamiast jednej „świętej prawdy”,</li>
          <li>unika losowych, niesprawdzonych porad.</li>
        </ul>

        <p>
          To AI, które ma być <strong>realnym wsparciem fotografa</strong>, a
          nie generatorem przypadkowych odpowiedzi.
        </p>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          Ciągłe doskonalenie
        </h3>

        <p>FOTAI jest projektowany jako narzędzie rozwijane:</p>

        <ul className="mb-4 list-disc pl-8">
          <li>prompt może być rozszerzany o nowe style i scenariusze,</li>
          <li>odpowiedzi są optymalizowane pod realne pytania fotografów,</li>
          <li>
            aplikacja uczy się lepszego dopasowania do potrzeb użytkowników.
          </li>
        </ul>

        <h3 className="material-title mb-4 mt-6 text-2xl font-semibold">
          FOTAI to:
        </h3>

        <ul className="mb-4 list-disc pl-8">
          <li>
            AI skonfigurowane jako <strong>instruktor fotografii</strong>,
          </li>
          <li>
            odpowiedzi oparte na <strong>praktyce, nie teorii</strong>,
          </li>
          <li>
            wsparcie, które działa jak <strong>warsztaty dostępne 24/7</strong>.
          </li>
        </ul>
      </div>
    </>
  );
}
