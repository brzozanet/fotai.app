# Sprint 1 Phase 2: Autentykacja — FOTAI

> 🎯 **Cel sprintu**: Użytkownik może się zarejestrować, zalogować i pozostać zalogowany po odświeżeniu strony. Backend chroni endpointy tokenem JWT.

**Timeframe**: 1 dzień (4–5h pracy efektywnej)  
**Poziom**: Junior — wszystkie technologie wytłumaczone od podstaw

---

## 📋 Przegląd Sprintu

W tym sprincie budujesz **system autentykacji** — jeden z najbardziej fundamentalnych elementów każdej aplikacji webowej. Zanim to jednak zrobisz, musisz przygotować **bazę danych** (MySQL + Prisma), bo hasła i dane użytkowników muszą gdzieś mieszkać.

**Na koniec Sprint 1 Phase 2 powinieneś mieć**:

- ✅ Baza danych MySQL działa lokalnie
- ✅ Prisma ORM skonfigurowane, model `User` gotowy
- ✅ Endpoint `POST /api/auth/register` — rejestruje użytkownika (hashuje hasło bcrypt)
- ✅ Endpoint `POST /api/auth/login` — loguje, zwraca token JWT
- ✅ Middleware `authMiddleware` — chroni endpointy (401 bez tokenu)
- ✅ Frontend: formularz rejestracji i logowania
- ✅ Frontend: `authStore` (Zustand) trzyma token JWT i dane użytkownika
- ✅ Po odświeżeniu strony user pozostaje zalogowany (token w localStorage)

**Dlaczego to ważne?**

Bez autentykacji każdy użytkownik widzi dane wszystkich innych. System logowania to fundament fazy 2 — bez niego nie możesz zapisywać chatów "dla konkretnego użytkownika". Nauczysz się tu wzorców używanych w każdej profesjonalnej aplikacji.

---

## 🧱 Nowe technologie w tym sprincie

### MySQL — co to jest?

**MySQL** to relacyjna baza danych. Dane przechowuje w tabelach (jak arkusz Excel), a między tabelami mogą być relacje ("user ma wiele chatów").

W Phase 2 używamy **MySQL** hostowanego na Twoim koncie cyber_Folks. Prisma obsługuje oba silniki (MySQL i PostgreSQL) identycznie — różnica jest tylko w jednej linii konfiguracji.

**Analogia**: Jeśli localStorage to "notatnik na biurku", to MySQL to "szafa z segregatorami w archiwum firmy" — bardziej pojemna, trwała i dostępna z wielu miejsc.

**Dlaczego nie localStorage?**

- localStorage jest tylko lokalnie (na jednym urządzeniu)
- localStorage nie ma autentykacji — każdy może odczytać
- localStorage nie obsługuje relacji między danymi

---

### Prisma ORM — co to jest?

**ORM** = Object-Relational Mapper. Tłumaczy kod TypeScript na zapytania SQL.

**Bez Prismy** (czysty SQL):

```sql
SELECT * FROM users WHERE email = 'jan@example.com';
```

**Z Prismą** (TypeScript):

```typescript
const user = await prisma.user.findUnique({
  where: { email: "jan@example.com" },
});
```

**Dlaczego Prisma?** Nie musisz znać SQL. Piszesz TypeScript i masz autouzupełnianie. Prisma też generuje schemat bazy danych z pliku `.prisma` i zarządza migracjami (zmianami struktury bazy).

---

### bcrypt — co to jest?

**bcrypt** to algorytm hashowania haseł. Hash to jednokierunkowe przekształcenie — z hasła `"tajne123"` robi coś w stylu `"$2b$10$xK9mP..."`. Tego nie da się odwrócić.

**Dlaczego nie przechowywać hasła wprost?**

- Jeśli baza danych wycieknie, atakujący pozna hasła **wszystkich** użytkowników
- Wiele osób używa tych samych haseł w różnych serwisach
- Przechowywanie plaintext haseł to **krytyczny błąd bezpieczeństwa** (OWASP Top 10)

**Jak działa weryfikacja?**

```typescript
// Rejestracja: zapisujemy hash, nie hasło
const hash = await bcrypt.hash("tajne123", 10); // "10" = cost factor (ile rund)

// Logowanie: porównujemy hasło z hashem
const isValid = await bcrypt.compare("tajne123", hash); // true
const isValid2 = await bcrypt.compare("zle_haslo", hash); // false
```

---

### JWT — co to jest?

**JWT** = JSON Web Token. To podpisany token, który dowodzi tożsamości użytkownika.

**Flow**:

1. User loguje się → backend weryfikuje hasło → generuje JWT → wysyła do frontendu
2. Frontend zapisuje JWT (localStorage) i wysyła go w każdym kolejnym requeście w nagłówku
3. Backend sprawdza podpis JWT — jeśli jest OK, wie kto to jest bez pytania bazy danych

**Anatomia JWT** (3 części rozdzielone `.`):

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbG9iLi4uIn0.xK9mP...
      HEADER               PAYLOAD (dane)           SIGNATURE
```

**Payload** to dane zakodowane w base64 (nie szyfrowane!) — NIE umieszczaj tam hasła!

```json
{ "userId": "clob...", "email": "jan@example.com", "iat": 1234567890 }
```

**Analogia**: JWT to jak pieczęć na wosie na liście — jeśli pieczęć jest nienaruszona, wiesz że list jest autentyczny i nikt go nie podmienił.

---

## 🎯 Task 1.1: Lokalna baza MySQL (0.25h)

### Cel

Uruchomienie lokalnej bazy danych MySQL, na której będziesz pracować podczas developmentu. Na produkcji używasz bazy MySQL na cyber_Folks — lokalnie uruchamiasz identyczną wersję, żeby mieć pewność, że kod będzie działał tak samo.

### Opcja A: Docker (zalecane)

Jeśli masz Dockera, to najprostszy sposób.

**Sprawdź czy masz Dockera**:

```bash
docker --version
```

**Skonfiguruj zmienne dla Docker Compose**:

W root repo masz pliki `docker-compose.yml` oraz `.env.example`.

Skopiuj `.env.example` do `.env`:

**Windows PowerShell**:

```powershell
Copy-Item .env.example .env
```

**Windows CMD**:

```bat
copy .env.example .env
```

**macOS / Linux / Git Bash**:

```bash
cp .env.example .env
```

Następnie uzupełnij wartości:

```env
MYSQL_ROOT_PASSWORD=twoje-lokalne-haslo
MYSQL_DATABASE=fotai_dev
MYSQL_PORT=3306
```

**Uruchom MariaDB przez Docker Compose** (identyczna wersja jak na cyber_Folks):

```bash
docker compose up -d
```

> 📌 **Uwaga**: Twoja baza na cyber_Folks to **MariaDB 10.6**, aby mieć pewność identyczności lokalnie — uruchamiamy tę samą wersję. MariaDB to fork MySQL'a — 100% kompatybilny, Prisma obsługuje go bez zmian (`provider = "mysql"`).

**Co dokładnie robi ten setup?**

- `docker-compose.yml` — opisuje usługę MariaDB 10.6
- `.env` w root repo — przechowuje wartości dla Compose (`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`)
- `docker compose up -d` — tworzy i uruchamia kontener w tle
- `fotai_mysql_data` — named volume, w którym Docker przechowuje dane bazy, więc nie znikają po zwykłym restarcie kontenera
- `3306:3306` — mapowanie portu MariaDB z kontenera na port Twojej maszyny

**Co to jest named volume i po co tu jest?**

Named volume to przestrzeń dyskowa zarządzana przez Dockera, podpinana do kontenera jak „zewnętrzny dysk". W tym projekcie volume `fotai_mysql_data` jest montowany do katalogu `/var/lib/mysql`, czyli miejsca, gdzie MariaDB przechowuje swoje pliki danych.

To ważne, bo bez volume dane bazy byłyby związane z warstwą samego kontenera. Po usunięciu kontenera mógłbyś stracić całą bazę. Dzięki volume możesz bezpiecznie robić `docker compose down` i potem `docker compose up -d`, a dane nadal zostaną.

> 📌 **Praktycznie**: nie pracujesz na tych plikach bezpośrednio z Eksploratora Windows. Dostęp do danych bazy robisz przez Prismę, SQL, Prisma Studio albo klienta DB typu DBeaver.

**Sprawdź czy działa**:

```bash
docker compose ps
```

Powinieneś zobaczyć `fotai-mysql` ze statusem `Up`.

**Podstawowe komendy na później**:

```bash
docker compose stop
docker compose up -d
```

Jeśli chcesz zatrzymać i usunąć kontener, ale zostawić dane w volume:

```bash
docker compose down
```

---

### Opcja B: Instalacja natywna

Pobierz installer ze strony [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) i zainstaluj. Podczas instalacji zapamiętaj hasło dla użytkownika `root`.

---

### Connection String

```
mysql://root:TWOJE_LOKALNE_HASLO@localhost:3306/fotai_dev
```

Format: `mysql://[user]:[password]@[host]:[port]/[database]`

Wstaw tu dokładnie to samo hasło, które wpisałeś w `MYSQL_ROOT_PASSWORD`. Tego connection stringa użyjesz potem w `backend/.env` jako `DATABASE_URL`.

---

### Sprawdzenie

- [x] MySQL działa lokalnie (Docker Compose: `docker compose ps` pokazuje kontener `Up`)
- [x] Możesz się połączyć (sprawdź w kolejnym kroku przez Prismę)

---

## 🎯 Task 1.2: Konfiguracja Prisma ORM (0.5h)

### Cel

Dodanie Prismy do backendu, zdefiniowanie modelu `User` i utworzenie tabel w bazie przez migrację.

### Co to jest migracja?

**Migracja** to plik SQL opisujący zmianę struktury bazy danych. Zamiast ręcznie pisać `CREATE TABLE users (...)`, definiujesz schemat w Prismie, a Prisma generuje ten SQL za Ciebie. Migracje wersjonujesz w Git — każdy wie, jak ewoluowała baza.

---

### Krok 1: Instalacja pakietów

W folderze `backend/`:

```bash
cd backend
npm install @prisma/client
npm install prisma --save-dev
```

**Co instalujemy?**

- `@prisma/client` — klient do zapytań (używany w kodzie produkcyjnym)
- `prisma` (devDependency) — CLI do generowania migracji (tylko development)

---

### Krok 2: Inicjalizacja Prismy

```bash
npx prisma init --datasource-provider mysql
```

To polecenie tworzy:

- `backend/prisma/schema.prisma` — plik schematu bazy danych
- Dodaje `DATABASE_URL` do pliku `.env`

---

### Krok 3: Plik schematu

Otwórz `backend/prisma/schema.prisma` i **zastąp całość** tym kodem:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  chats        Chat[]
}

model Chat {
  id        String    @id @default(cuid())
  title     String    @default("Nowy czat")
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  role      String
  content   String   @db.Text
  openaiId  String?
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

> ⚠️ **Dlaczego `@db.Text` na `content`?** MySQL domyślnie tworzy pole `VARCHAR(191)` — to za mało na długie odpowiedzi AI. `@db.Text` mówi Prismie, żeby użyła typu `TEXT` (do ok. 65 000 znaków).

**Wyjaśnienie modeli**:

#### `@id @default(cuid())`

Każdy rekord ma unikalny identyfikator. `cuid()` generuje string jak `"clob4x2y80000lje3g7e7cxm1"`. Alternatywą jest `@default(uuid())` — oba są dobre.

#### `@unique`

Prisma automatycznie tworzy unique constraint w bazie. Nie można mieć dwóch użytkowników z tym samym emailem.

#### `@relation`

Definiuje relację między tabelami:

- Chat "należy do" User przez pole `userId`
- `onDelete: Cascade` — jeśli usuniesz użytkownika, jego chaty też się usuną (nie zostaną osierocone rekordy)

#### `String?` (z `?`)

Pole opcjonalne — może być `null`. `openaiId` jest opcjonalne, bo wiadomości użytkownika nie mają ID z OpenAI.

---

### Krok 4: Zmienne środowiskowe

W `backend/.env` dodaj (lub zaktualizuj) `DATABASE_URL`:

```env
# Lokalny development (Docker MySQL):
DATABASE_URL="mysql://root:TWOJE_LOKALNE_HASLO@localhost:3306/fotai_dev"

# Produkcja (cyber_Folks) — uzupełnij po założeniu bazy w DirectAdmin:
# DATABASE_URL="mysql://db_user:db_password@s53.cyber-folks.pl:3306/db_name"

OPENAI_API_KEY="sk-..."
# ... pozostałe zmienne
JWT_SECRET="super-tajny-klucz-do-podpisywania-tokenow-zmien-to-na-produkcji"
```

`TWOJE_LOKALNE_HASLO` musi być identyczne jak wartość `MYSQL_ROOT_PASSWORD` z rootowego `.env` używanego przez Docker Compose.

**Ważne o `JWT_SECRET`**: To klucz, którym backend podpisuje tokeny JWT. Musi być:

- Długi i losowy (na produkcji: minimum 32 znaki, najlepiej 64+)
- Utajniony — nigdy nie wrzucaj do Gita (`.env` jest w `.gitignore`)

---

### Krok 5: Uruchom migrację

```bash
npx prisma migrate dev --name init
```

**Co to robi?**

1. Porównuje schemat `.prisma` z aktualnym stanem bazy
2. Generuje plik SQL w `prisma/migrations/...`
3. Wykonuje ten SQL na lokalnej bazie
4. Generuje klienta TypeScript (`@prisma/client`) z pełnym typo-safety

**Wynik** — Prisma stworzyła tabele `users`, `chats`, `messages` w bazie `fotai_dev`.

---

### Krok 6: Podejrzyj bazę (opcjonalnie, ale warto!)

```bash
npx prisma studio
```

Otwiera się przeglądarka pod `http://localhost:5555` z GUI do przeglądania bazy. Zobaczysz puste tabele `User`, `Chat`, `Message`. Po rejestracji pierwszego użytkownika wróć tu i sprawdź, że rekord jest widoczny.

---

### Sprawdzenie

- [x] `backend/prisma/schema.prisma` istnieje z modelami User, Chat, Message
- [x] `DATABASE_URL` dodany do `backend/.env`
- [x] `JWT_SECRET` dodany do `backend/.env`
- [x] Migracja wykonana (`npx prisma migrate dev --name init` zakończył się sukcesem)
- [x] Folder `backend/prisma/migrations/` zawiera pliki migracji

---

## 🎯 Task 1.3: Klient Prismy (Singleton) (0.25h)

### Cel

Utworzenie jednej, współdzielonej instancji klienta Prismy w całym backendzie.

### Dlaczego Singleton?

W Node.js podczas developmentu (hot reload) moduły są przeładowywane. Bez singletona każde przeładowanie tworzyłoby nowe połączenie z bazą. Baza ma limit połączeń — za dużo połączeń = błąd.

**Utwórz plik `backend/src/lib/prisma.ts`**:

```typescript
import { PrismaClient } from "@prisma/client";

// NOTE: Singleton pattern — jedna instancja Prismy dla całej aplikacji
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Wyjaśnienie**:

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
```

`globalThis` to globalny obiekt Node.js — istnieje przez cały czas życia procesu, nawet podczas hot reload modułów.

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient(...)
```

Operator `??` (nullish coalescing) — "jeśli `globalForPrisma.prisma` jest `null` lub `undefined`, utwórz nową instancję; w przeciwnym razie użyj istniejącej".

```typescript
log: process.env.NODE_ENV === "development" ? ["query"] : [];
```

W development Prisma loguje każde zapytanie SQL w konsoli — pomocne do debugowania. W produkcji wyłączamy logi (performance + bezpieczeństwo).

---

### Sprawdzenie

- [x] Plik `backend/src/lib/prisma.ts` utworzony
- [x] Eksportuje `prisma` (instancję `PrismaClient`)

---

## 🎯 Task 1.4: Endpointy Autentykacji — Backend (1h)

### Cel

Implementacja `POST /api/auth/register` i `POST /api/auth/login`.

### Instalacja pakietów

```bash
cd backend
npm install bcrypt jsonwebtoken
npm install @types/bcrypt @types/jsonwebtoken --save-dev
```

---

### Plik: `backend/src/routes/auth.ts`

**Utwórz nowy plik** `backend/src/routes/auth.ts`:

```typescript
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const BCRYPT_ROUNDS = 10; // ile rund hashowania (więcej = bezpieczniej, ale wolniej)

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Walidacja wejściowych danych
    if (!email || !password) {
      return res.status(400).json({ error: "Email i hasło są wymagane." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Hasło musi mieć co najmniej 8 znaków." });
    }

    // 2. Sprawdź czy email jest już zajęty
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Ten email jest już zajęty." });
    }

    // 3. Zahashuj hasło — NIGDY nie zapisuj plaintext!
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 4. Zapisz użytkownika w bazie
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    // 5. Wygeneruj token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // payload — dane w tokenie
      JWT_SECRET,
      { expiresIn: "7d" }, // token wygaśnie po 7 dniach
    );

    // 6. Zwróć token i podstawowe dane usera (BEZ passwordHash!)
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("[auth/register]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Walidacja
    if (!email || !password) {
      return res.status(400).json({ error: "Email i hasło są wymagane." });
    }

    // 2. Znajdź użytkownika po emailu
    const user = await prisma.user.findUnique({ where: { email } });

    // 3. Sprawdź hasło — używamy tego samego komunikatu błędu dla
    //    "nie znaleziono usera" i "złe hasło" (nie ujawniamy która sytuacja wystąpiła)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło." });
    }

    // 4. Wygeneruj JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});
```

---

### Wyjaśnienie kluczowych fragmentów

#### Punkt 3 w login — "Generic error message"

```typescript
if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return res.status(401).json({ error: "Nieprawidłowy email lub hasło." });
}
```

**Dlaczego jeden komunikat dla dwóch różnych błędów?**

Gdybyś zwrócił `"Użytkownik nie istnieje"` vs `"Złe hasło"`, atakujący mógłby zrobić **user enumeration** — sprawdzić czy dany email istnieje w systemie (np. testując maile z wycieku danych). Jeden generic komunikat to standard bezpieczeństwa.

---

#### `{ expiresIn: "7d" }`

Token wygaśnie po 7 dniach. Po wygaśnięciu użytkownik musi się ponownie zalogować. Im krótszy czas, tym bezpieczniej (skradziony token jest bezużyteczny szybciej), ale mniej wygodnie.

Formaty: `"15m"` (minuty), `"2h"` (godziny), `"7d"` (dni).

---

### Podpięcie routera w `index.ts`

Otwórz `backend/src/index.ts` i dodaj:

```typescript
import { authRouter } from "./routes/auth.js";

// ... (istniejący kod)

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
```

---

### Sprawdzenie

- [x] `backend/src/routes/auth.ts` utworzony
- [x] `authRouter` podpięty w `backend/src/index.ts` pod `/api/auth`
- [x] Ręczny test rejestracji (curl lub Postman):

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "tajne1234"}'
```

Oczekiwany wynik: `{ "token": "eyJ...", "user": { "id": "...", "email": "test@example.com" } }`

- [x] Ręczny test logowania:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "tajne1234"}'
```

- [x] Prisma Studio pokazuje nowego usera w tabeli `User` (z `passwordHash`, nie z hasłem)

---

## 🎯 Task 1.5: Middleware JWT (0.5h)

### Cel

Stworzenie funkcji pośredniej (`middleware`), która sprawdza czy request ma ważny token JWT. Chronione endpointy (chaty, wiadomości) będą go używać.

### Czym jest Middleware?

Middleware to funkcja uruchamiana **przed** handlerem route'a. Express przetwarza requesty przez łańcuch middleware, jak przenośnik taśmowy:

```
Request → cors() → express.json() → authMiddleware → routeHandler → Response
```

Jeśli middleware wywoła `next()` — request idzie dalej. Jeśli wywoła `res.status(401).json(...)` — request jest zatrzymany i odpowiedź wraca do klienta.

---

### Typy — rozszerzenie Request

TypeScript wymaga, żebyśmy powiedzieli mu, że dodajemy pole `user` do obiektu `Request`:

**Utwórz `backend/src/types/express.d.ts`**:

```typescript
// NOTE: Rozszerzenie typów Express — dodajemy pole `user` do Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
```

---

### Middleware

**Utwórz `backend/src/middleware/auth.ts`**:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1. Wyciągnij token z nagłówka Authorization
  //    Format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokenu autoryzacyjnego." });
  }

  const token = authHeader.split(" ")[1]; // ["Bearer", "eyJ..."][1]

  try {
    // 2. Zweryfikuj podpis tokenu
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // 3. Dołącz dane usera do obiektu request — będą dostępne w handlerze
    req.user = { userId: payload.userId, email: payload.email };

    // 4. Przekaż request dalej
    next();
  } catch (error) {
    // jwt.verify rzuca błąd gdy token jest nieważny lub wygasł
    return res.status(401).json({ error: "Token jest nieważny lub wygasł." });
  }
}
```

---

### Przykład użycia middleware

Aby chronić endpoint, przekazujesz `authMiddleware` jako drugi argument:

```typescript
// Endpoint NIE chroniony — każdy może wywołać
app.get("/health", (req, res) => { ... });

// Endpoint CHRONIONY — tylko z ważnym JWT
chatRouter.get("/", authMiddleware, async (req, res) => {
  const { userId } = req.user!; // TypeScript wie, że user istnieje (middleware to gwarantuje)
  const chats = await prisma.chat.findMany({ where: { userId } });
  res.json(chats);
});
```

---

### Sprawdzenie

- [x] `backend/src/types/express.d.ts` utworzony
- [x] `backend/src/middleware/auth.ts` utworzony
- [x] Test manualny middleware (bez tokenu → 401):

```bash
curl http://localhost:3001/api/chats
# Oczekiwane: { "error": "Brak tokenu autoryzacyjnego." }
```

- [x] Test z tokenem (skopiuj token z rejestracji):

```bash
curl http://localhost:3001/api/chats \
  -H "Authorization: Bearer TWOJ_TOKEN_TUTAJ"
# (endpoint /api/chats jeszcze nie istnieje — dostaniesz 404, ale NIE 401 — to OK!)
```

---

## 🎯 Task 1.6: Typy współdzielone (0.25h)

### Cel

Dodanie typów TypeScript dla autentykacji — zarówno w backendzie, jak i we frontendzie.

### Backend: `backend/src/types/auth.ts`

**Utwórz plik**:

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthError {
  error: string;
}
```

### Frontend: `frontend/src/types/auth.ts`

**Utwórz plik**:

```typescript
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthError {
  error: string;
}
```

---

### Sprawdzenie

- [x] `backend/src/types/auth.ts` utworzony
- [x] `frontend/src/types/auth.ts` utworzony

---

## 🎯 Task 1.7: authService na Frontendzie (0.5h)

### Cel

Serwis obsługujący requesty do `/api/auth/register` i `/api/auth/login` po stronie frontendu.

### Plik: `frontend/src/services/authService.ts`

**Utwórz plik**:

```typescript
import type { AuthResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    // Rzucamy błąd z komunikatem z serwera (np. "Ten email jest już zajęty.")
    throw new Error(data.error || "Nieznany błąd serwera.");
  }

  return data as T;
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", { email, password });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", { email, password });
}
```

---

### Sprawdzenie

- [x] `frontend/src/services/authService.ts` utworzony
- [x] Eksportuje `register` i `login`

---

## 🎯 Task 1.8: authStore (Zustand) (0.5h)

### Cel

Store Zustand trzymający token JWT i dane zalogowanego użytkownika. Używa `persist`, żeby token przeżył odświeżenie strony.

### Plik: `frontend/src/store/authStore.ts`

**Utwórz plik**:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types/auth";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: "fotai-auth-storage" }, // klucz w localStorage
  ),
);
```

**Wyjaśnienie**:

#### `isAuthenticated`

Computed state na podstawie tokenu. Możesz też sprawdzać `token !== null`, ale dedykowana flaga `isAuthenticated` jest czytelniejsza:

```typescript
// zamiast:
if (authStore.token !== null) { ... }
// piszesz:
if (authStore.isAuthenticated) { ... }
```

#### `persist` z `name`

Token JWT zostanie zapisany w `localStorage` pod kluczem `"fotai-auth-storage"`. Po odświeżeniu strony Zustand automatycznie go wczyta — użytkownik pozostaje zalogowany.

---

### Sprawdzenie

- [x] `frontend/src/store/authStore.ts` utworzony
- [x] Stan jest persystowany (`persist` middleware)

---

## 🎯 Task 1.9: Formularze Rejestracji i Logowania (1h)

### Cel

Budowa stron `/register` i `/login` z formularzami. Używamy `react-hook-form` do zarządzania formularzem i `zod` do walidacji.

### Instalacja

```bash
cd frontend
npm install react-hook-form zod @hookform/resolvers
```

**Po co `react-hook-form`?**

Ręczna kontrola formularzy przez `useState` to dużo boilerplate:

```typescript
// ❌ Bez react-hook-form
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [emailError, setEmailError] = useState("");
// ... i tak dalej dla każdego pola
```

`react-hook-form` zarządza tym automatycznie (rejestracja pól, walidacja, błędy, submit), przy minimum re-renderów.

**Po co `zod`?**

Zod to biblioteka do walidacji w TypeScript. Definiujesz schemat danych i automatycznie dostajesz walidację + komunikaty błędów:

```typescript
const schema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
});
```

---

### Strona Logowania: `frontend/src/pages/LoginPage.tsx`

**Utwórz plik**:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// 1. Schemat walidacji Zod
const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginForm = z.infer<typeof loginSchema>; // TypeScript type z schematu Zod

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // 2. Inicjalizacja react-hook-form z walidatorem Zod
  const {
    register,       // rejestruje pole w formularzu
    handleSubmit,   // wrapper na submit — wywołuje onSubmit tylko gdy formularz jest poprawny
    formState: { errors, isSubmitting }, // błędy walidacji + stan ładowania
    setError,       // ręczne ustawienie błędu (np. "Złe hasło" z serwera)
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Handler submit
  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await login(data.email, data.password);
      setAuth(response.token, response.user);
      navigate("/"); // przekieruj na stronę główną po zalogowaniu
    } catch (error) {
      // Błąd z serwera (np. "Nieprawidłowy email lub hasło")
      setError("root", {
        message: error instanceof Error ? error.message : "Błąd logowania",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Zaloguj się</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Błąd ogólny (z serwera) */}
          {errors.root && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {errors.root.message}
            </div>
          )}

          {/* Pole email */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="jan@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Pole hasło */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Hasło</label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Przycisk submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nie masz konta?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

### Strona Rejestracji: `frontend/src/pages/RegisterPage.tsx`

**Utwórz plik** (bardzo podobny do LoginPage, z dodatkową walidacją hasła):

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { register as registerUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const registerSchema = z
  .object({
    email: z.string().email("Podaj prawidłowy adres email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"], // przypisz błąd do pola confirmPassword
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await registerUser(data.email, data.password);
      setAuth(response.token, response.user);
      navigate("/");
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Błąd rejestracji",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Utwórz konto</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="jan@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Hasło</label>
            <Input type="password" placeholder="min. 8 znaków" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Potwierdź hasło</label>
            <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Masz już konto?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

### Sprawdzenie

- [x] `frontend/src/pages/LoginPage.tsx` utworzony
- [x] `frontend/src/pages/RegisterPage.tsx` utworzony
- [x] Walidacja działa (spróbuj wysłać pusty formularz — powinny pojawić się błędy)
- [x] Błąd z serwera wyświetla się (np. "Ten email jest już zajęty.")

---

## 🎯 Task 1.10: Routing i Ochrona Tras (0.5h)

### Cel

Dodanie tras `/login` oraz `/register` w React Router i implementacja **ProtectedRoute** — komponentu, który przekierowuje niezalogowanych na `/login`.

### ProtectedRoute

**Utwórz `frontend/src/components/auth/ProtectedRoute.tsx`**:

```typescript
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Chroni dzieci przed dostępem bez zalogowania.
 * Niezalogowany user zostaje przekierowany na /login.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Outlet renderuje zagnieżdżone trasy
  return <Outlet />;
}
```

**Wyjaśnienie**:

`<Outlet />` to placeholder — React Router wstawi tu dopasowaną podtrasę. Używamy go zamiast `{children}`, bo działa lepiej z nested routes.

`replace` w `<Navigate>` zastępuje obecny wpis w historii przeglądarki — przycisk "Wstecz" nie wróci do chronionej strony (zamiast tego cofnie się o stronę wcześniej).

---

### Aktualizacja Routera

Otwórz plik z konfiguracją routera (prawdopodobnie `frontend/src/index.tsx` lub `frontend/src/App.tsx`) i dodaj trasy dla logowania/rejestracji:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
// ... pozostałe importy

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trasy publiczne */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Trasy chronione — obejmuje ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          {/* Tutaj w Sprint 2 dodasz trasy chatów */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Przycisk Wyloguj

Dodaj przycisk wylogowania w headerze (np. `frontend/src/components/layout/Header.tsx`):

```typescript
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="...">
      {/* ... istniejący kod ... */}
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Wyloguj
          </button>
        </div>
      )}
    </header>
  );
}
```

---

### Sprawdzenie

- [x] `/login` wyświetla formularz logowania
- [x] `/register` wyświetla formularz rejestracji
- [x] Wejście na `/` bez zalogowania przekierowuje na `/login`
- [x] Po zalogowaniu użytkownik trafia na `/`
- [x] Po wylogowaniu (przycisk) użytkownik trafia na `/login`
- [x] Po odświeżeniu strony zalogowany użytkownik **pozostaje zalogowany**

---

## ✅ Checklist Sprint 1 Phase 2 — Finał

### Backend

- [ ] MySQL uruchomiony lokalnie (Docker Compose)
- [ ] Prisma skonfigurowana, schema z modelami: `User`, `Chat`, `Message`
- [ ] Migracja `init` wykonana — tabele istnieją w bazie
- [ ] `backend/src/lib/prisma.ts` — singleton klienta Prismy
- [ ] `POST /api/auth/register` działa (tworzy usera, zwraca JWT)
- [ ] `POST /api/auth/login` działa (weryfikuje hasło, zwraca JWT)
- [ ] `authMiddleware` — odrzuca requesty bez tokenu (401)
- [ ] `JWT_SECRET` w `backend/.env` (nigdy w Git!)

### Frontend

- [ ] `authService.ts` — `register()` i `login()`
- [ ] `authStore.ts` — Zustand + persist (token w localStorage)
- [ ] `LoginPage.tsx` — formularz, walidacja Zod, błędy z serwera
- [ ] `RegisterPage.tsx` — formularz, walidacja Zod, potwierdzenie hasła
- [ ] `ProtectedRoute.tsx` — przekierowanie niezalogowanych
- [ ] Routes skonfigurowane (`/login`, `/register`, chronione `/`)
- [ ] Przycisk Wyloguj w headerze
- [ ] Po odświeżeniu — user pozostaje zalogowany

### Testy manualne

- [ ] Zarejestruj nowego użytkownika → powinien trafić na stronę główną
- [ ] Otwórz Prisma Studio — user widoczny w tabeli (z hashem, nie plaintext)
- [ ] Wyloguj się → jesteś na `/login`
- [ ] Zaloguj się ponownie → wracasz na stronę główną
- [ ] Odśwież stronę → nadal zalogowany
- [ ] Spróbuj złego hasła → komunikat błędu "Nieprawidłowy email lub hasło."
- [ ] Spróbuj zarejestrować się dwukrotnie z tym samym emailem → "Ten email jest już zajęty."

---

## 🚀 Co dalej? Sprint 2 Phase 2

W Sprint 2 skupiasz się na **wieloczatowości i zapisywaniu rozmów w bazie danych**:

- Endpointy REST dla chatów: `GET /api/chats`, `POST /api/chats`, `DELETE /api/chats/:id`
- Endpoint dla wiadomości: `GET /api/chats/:id/messages`, `POST /api/chats/:id/messages`
- Sidebar w UI z listą chatów i przyciskiem "Nowy czat"
- Wiadomości zapisywane w MySQL (zamiast localStorage)
- Przełączanie między chatami
