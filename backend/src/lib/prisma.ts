import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let adapter;

if (connectionString) {
  // [TRYB PRODUKCYJNY / RAILWAY]
  // Przekazujemy connection string BEZPOŚREDNIO do adaptera.
  // Adapter sam wie, jak go użyć do stworzenia puli połączeń.
  adapter = new PrismaMariaDb(connectionString);
} else {
  // [TRYB LOKALNY / DEVELOPMENT]
  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_NAME = process.env.DB_NAME;
  const DB_PORT = process.env.DB_PORT;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
    throw new Error(
      "Brak zmiennych .env do połączenia z bazą lokalną. Uzupełnij plik lub ustaw DATABASE_URL.",
    );
  }

  // Tworzymy obiekt konfiguracyjny (PoolConfig) i przekazujemy go do adaptera.
  const poolConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
  };
  adapter = new PrismaMariaDb(poolConfig);
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
    adapter,
    // Włączamy logowanie zapytań SQL tylko w trybie deweloperskim,
    // aby łatwiej debugować, co dzieje się pod spodem.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// W środowisku deweloperskim zapisujemy stworzoną instancję do globalnego obiektu.
// Dzięki temu przy następnym przeładowaniu kodu, zostanie ona ponownie użyta.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
