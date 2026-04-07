import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

// Wczytuje zmienne z backend/.env do process.env zanim stworzymy adapter i klienta Prisma.
dotenv.config();

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  throw new Error(
    "Brak wymaganych zmiennych. Uzupełnij plik .env i uruchom backend ponownie",
  );
}

// Adapter mówi Prisma 7, jakim sterownikiem i z jakimi danymi ma łączyć się z bazą.
// Dzięki temu logika zapytań zostaje w Prisma, a szczegóły połączenia są wymienne.
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Rozszerzamy typ globalThis o pole prisma, żeby TypeScript wiedział,
// że możemy przechować tam jedną współdzieloną instancję klienta.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Jeśli instancja już istnieje, używamy jej ponownie.
// Jeśli nie istnieje, tworzymy nową. To jest właściwy singleton.
// Ma to znaczenie szczególnie w dev, gdzie hot reload potrafi przeładować moduł wiele razy.
// Bez tego moglibyśmy tworzyć kolejne połączenia do bazy przy każdym przeładowaniu.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // W development logujemy SQL-e, żeby łatwiej debugować zapytania.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// W produkcji proces zwykle startuje raz, więc cache na globalThis nie jest potrzebny.
// W development zapisujemy klienta globalnie, żeby kolejne reloady używały tej samej instancji.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
