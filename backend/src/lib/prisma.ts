import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Pool } from "mariadb";
import dotenv from "dotenv";

// Wczytuje zmienne z pliku .env w katalogu 'backend' do globalnego obiektu process.env.
// Dzięki temu mamy dostęp do sekretów (np. haseł) bez zapisywania ich w kodzie.
dotenv.config();

// [STRATEGIA POŁĄCZENIA]
// Sprawdzamy, czy istnieje zmienna DATABASE_URL.
// Platformy hostingowe (Railway, Vercel, Heroku) dostarczają ją jako standardowy
// sposób na przekazanie danych do połączenia z bazą w jednym ciągu.
const connectionString = process.env.DATABASE_URL;

// Deklarujemy zmienną 'adapter', która będzie przechowywać konfigurację połączenia dla Prisma.
let adapter;

if (connectionString) {
  // [TRYB PRODUKCYJNY / RAILWAY]
  // Jeśli connectionString istnieje, to znaczy, że działamy na serwerze produkcyjnym.
  // Tworzymy pulę połączeń (Pool) bezpośrednio z tego stringa.
  // Pula połączeń to mechanizm, który zarządza aktywnymi połączeniami z bazą,
  // co znacznie zwiększa wydajność, bo nie trzeba tworzyć nowego połączenia dla każdego zapytania.
  const pool = new Pool({
    connectionString: connectionString,
  });
  // Inicjujemy adapter Prisma, przekazując mu gotową pulę połączeń.
  adapter = new PrismaMariaDb(pool);
} else {
  // [TRYB LOKALNY / DEVELOPMENT]
  // Jeśli connectionString nie istnieje, zakładamy, że pracujemy lokalnie
  // i wczytujemy dane do połączenia z pojedynczych zmiennych w pliku .env.
  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_NAME = process.env.DB_NAME;
  const DB_PORT = process.env.DB_PORT;

  // Sprawdzamy, czy wszystkie potrzebne zmienne są zdefiniowane.
  // Jeśli nie, rzucamy błąd, żeby programista od razu wiedział, co poprawić.
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
    throw new Error(
      "Brak zmiennych .env do połączenia z bazą lokalną. Uzupełnij plik lub ustaw DATABASE_URL.",
    );
  }

  // Tworzymy pulę połączeń, przekazując poszczególne dane.
  const pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
  });
  // Inicjujemy adapter Prisma z pulą połączeń skonfigurowaną dla środowiska lokalnego.
  adapter = new PrismaMariaDb(pool);
}

// [SINGLETON PATTERN]
// W środowisku Node.js (szczególnie w trybie deweloperskim z hot-reloading),
// kod może być przeładowywany wielokrotnie, co mogłoby prowadzić do tworzenia
// wielu instancji PrismaClient i wyczerpania limitu połączeń z bazą danych.
// Wzorzec Singleton zapobiega temu, zapewniając, że istnieje tylko jedna instancja klienta.

// Rozszerzamy globalny obiekt 'globalThis', aby mógł przechowywać naszą instancję PrismaClient.
// Robimy to w sposób bezpieczny dla TypeScriptu.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Tworzymy lub odzyskujemy instancję PrismaClient.
// Jeśli 'globalForPrisma.prisma' już istnieje, używamy jej.
// Jeśli nie, tworzymy nową instancję, przekazując jej skonfigurowany wcześniej adapter.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // Tutaj przekazujemy adapter dla trybu produkcyjnego LUB lokalnego.
    // Włączamy logowanie zapytań SQL tylko w trybie deweloperskim,
    // aby łatwiej debugować, co dzieje się pod spodem.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// W środowisku deweloperskim zapisujemy stworzoną instancję do globalnego obiektu.
// Dzięki temu przy następnym przeładowaniu kodu, zostanie ona ponownie użyta (patrz linia 101).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
