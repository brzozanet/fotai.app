import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

// ELI5: Wyobraź sobie, że Twoja aplikacja to kucharz.
// Kucharz potrzebuje klucza do spiżarni (bazy danych).
// Nie chcemy zostawiać klucza na widoku (w kodzie).
// Zamiast tego, zapisujemy go na tajnej karteczce w pliku `.env`.
// Ta linijka mówi kucharzowi: "Idź, przeczytaj tajną karteczkę i zapamiętaj klucz".
dotenv.config();

// ELI5: Pytamy "szefa kuchni" (serwera Railway): "Czy dałeś nam jeden, magiczny klucz do spiżarni?".
// Ten magiczny klucz to `DATABASE_URL`. Jeśli go dostaliśmy, to znaczy, że jesteśmy w restauracji (na serwerze).
const connectionString = process.env.DATABASE_URL;

// ELI5: Przygotowujemy specjalnego pomocnika kucharza (adapter), który będzie umiał otworzyć spiżarnię.
// Na razie jeszcze nie wiemy, którą spiżarnię ma otworzyć.
let adapter;

if (connectionString) {
  // [SCENARIUSZ 1: Jesteśmy w restauracji (na serwerze Railway)]
  // ELI5: Mamy magiczny klucz od szefa!
  // Dajemy go naszemu pomocnikowi. On jest na tyle mądry,
  // że sam odnajdzie wielką, profesjonalną spiżarnię w restauracji.
  adapter = new PrismaMariaDb(connectionString);
} else {
  // [SCENARIUSZ 2: Jesteśmy w domu (na Twoim komputerze)]
  // ELI5: Nie mamy magicznego klucza, więc musimy dać pomocnikowi dokładne instrukcje
  // do naszej domowej spiżarni, które są zapisane na tajnej karteczce.
  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_NAME = process.env.DB_NAME;
  const DB_PORT = process.env.DB_PORT;

  // ELI5: Sprawdzamy, czy na pewno daliśmy pomocnikowi wszystkie instrukcje.
  // Jeśli czegoś brakuje, krzyczymy, żeby nie błądził po omacku.
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
    throw new Error(
      "Brak instrukcji w .env do znalezienia domowej spiżarni! Uzupełnij plik.",
    );
  }

  // ELI5: Zbieramy wszystkie instrukcje w jedną zgrabną notatkę...
  const poolConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
  };
  // ...i dajemy tę notatkę naszemu pomocnikowi.
  adapter = new PrismaMariaDb(poolConfig);
}

// [PROBLEM: ZBYT WIELU KUCHARZY W KUCHNI]
// ELI5: W trybie deweloperskim, za każdym razem, gdy zmieniasz kod, kuchnia (aplikacja) się odświeża.
// Gdybyśmy nie byli ostrożni, po każdej zmianie zatrudnialibyśmy nowego kucharza.
// Po 10 zmianach mielibyśmy 10 kucharzy, którzy wpadają na siebie i robią bałagan.
// To jest tzw. "wzorzec Singleton" - pilnujemy, żeby w kuchni był zawsze TYLKO JEDEN kucharz.

// ELI5: Tworzymy specjalne, globalne miejsce w kuchni (coś jak tablica ogłoszeń),
// gdzie możemy zapisać, kto jest aktualnie głównym kucharzem.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ELI5: To jest moment zatrudnienia.
// Sprawdzamy na tablicy ogłoszeń: "Czy mamy już głównego kucharza?".
// Jeśli tak - wołamy go.
// Jeśli nie - zatrudniamy nowego, wręczamy mu narzędzia (nasz pomocnik ze spiżarnią) i ogłaszamy go głównym kucharzem.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // Dajemy kucharzowi pomocnika, który wie, gdzie jest spiżarnia.
    // Mówimy kucharzowi, żeby głośno opowiadał co gotuje (logował zapytania), ale tylko w domu (w dev),
    // bo w restauracji (w prod) klienci nie muszą tego słuchać.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// ELI5: Jeśli jesteśmy w domu (w trybie deweloperskim), to po zatrudnieniu kucharza,
// zapisujemy jego imię na globalnej tablicy ogłoszeń.
// Dzięki temu, przy następnym odświeżeniu kuchni, nie zatrudnimy nowego, tylko zawołamy tego samego.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
