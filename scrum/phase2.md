# Phase 2: Konta Użytkowników & Wieloczatowość — FOTAI

> 🎯 **Cel Phase 2**: Dodanie pełnego systemu autentykacji, persystentnej historii rozmów w bazie danych i możliwości prowadzenia wielu niezależnych chatów.

**Timeframe**: ~3 sprinty (ok. 3-4 dni efektywnej pracy)
**Poziom**: Junior (brak doświadczenia z Prisma, MySQL, JWT, bcrypt — wszystkiego nauczysz się w toku pracy)

---

## 🗺️ Co zmienia się względem Phase 1?

| Obszar                | Phase 1                               | Phase 2                                            |
| --------------------- | ------------------------------------- | -------------------------------------------------- |
| Historia czatu        | localStorage (tylko jeden czat)       | MySQL — cyber_Folks (wiele chatów, wiele urządzeń) |
| Tożsamość użytkownika | brak — wszyscy są anonimowi           | Rejestracja i logowanie (JWT + bcrypt)             |
| Trwałość danych       | Po wyczyszczeniu localStorage → brak  | Serwer → dane zawsze dostępne po zalogowaniu       |
| UI                    | Jeden czat                            | Panel z listą chatów + przełączanie                |
| Streaming odpowiedzi  | Cała odpowiedź naraz (po zakończeniu) | Słowa pojawiają się sukcesywnie (streaming)        |

---

## 🏗️ Architektura po Phase 2

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                          │
│  React + Vite + TailwindCSS + Shadcn/ui                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Zustand authStore (token JWT, dane usera)          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  chatService.ts (REST + Streaming)                  │   │
│  │  authService.ts (register/login/logout)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + Authorization: Bearer <token>
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Railway)                                           │
│  Express.js + TypeScript                                    │
│                                                             │
│  POST /api/auth/register  → rejestracja                     │
│  POST /api/auth/login     → logowanie, zwraca JWT           │
│  GET  /api/chats          → lista chatów usera (auth)       │
│  POST /api/chats          → utwórz nowy chat (auth)         │
│  GET  /api/chats/:id      → wiadomości czatu (auth)         │
│  POST /api/chats/:id/messages → wyślij wiadomość (streaming)│
│  DELETE /api/chats/:id    → usuń czat (auth)                │
│                                                             │
│  authMiddleware.ts → weryfikuje JWT w każdym request        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│  MYSQL (cyber_Folks — własny hosting)                      │
│                                                             │
│  users    { id, email, passwordHash, createdAt }            │
│  chats    { id, title, userId, createdAt }                  │
│  messages { id, role, content, chatId, openaiId, createdAt }│
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Podział na Sprinty

### ⚙️ Krok 0 — Przed Sprint 1: Migracja Backend Render → Railway

> **Czas**: ~30–60 min | **Kiedy**: przed pierwszą linią kodu Phase 2

**Dlaczego teraz?**  
Render zasypia po 15 min bezczynności (cold start ~30 s). Railway działa bez przerw na planie Hobby ($5/mies.) i będzie domem backendu przez całą Phase 2 oraz Phase 3.

**Kroki**:

1. Utwórz konto na railway.app i połącz z repozytorium GitHub
2. „New Project → Deploy from GitHub repo" → wybierz `fotai.app`
3. Ustaw „Root Directory" na `backend`
4. Dodaj zmienne środowiskowe: `OPENAI_API_KEY`, `FRONTEND_URL`, `PORT=3001` (i pozostałe z Render)
5. Skopiuj nowy URL Railway (np. `https://fotai-app-production.up.railway.app`)
6. Zaktualizuj `VITE_API_URL` w ustawieniach Vercel na nowy URL
7. Usuń serwis na Render

**Weryfikacja**: otwórz `<railway-url>/health` — powinno zwrócić `{ status: 'ok' }`. Przetestuj czat na stronie.

---

### Sprint 1 — Autentykacja (register/login/JWT/bcrypt)

**Cel**: Użytkownik może się zarejestrować i zalogować. Backend chroni endpointy tokenem JWT.

**Technologie**: `bcrypt`, `jsonwebtoken`, `Prisma` (User model, MySQL), React forms, `authStore` (Zustand), localStorage dla tokenu.

**Local dev setup**: lokalna baza MariaDB działa przez `docker compose up -d` z rootowego `docker-compose.yml`, a dane są trzymane w named volume `fotai_mysql_data`.

**Efekt końcowy**:

- Działający formularz rejestracji i logowania w UI
- Backend wystawia token JWT po poprawnym logowaniu
- Chronione endpointy odrzucają request bez ważnego tokenu (401 Unauthorized)
- Użytkownik pozostaje zalogowany po odświeżeniu strony (token w localStorage)

---

### Sprint 2 — Danych w bazie & Wieloczatowość

**Cel**: Każda rozmowa jest zapisywana w MySQL (cyber_Folks). Użytkownik może tworzyć wiele chatów i przełączać się między nimi.

**Technologie**: `Prisma` (Chat + Message models), `uuid`, REST API dla chatów, nowy widok listy chatów w UI.

**Efekt końcowy**:

- Panel boczny z listą chatów (Sidebar)
- Przycisk "Nowy czat" tworzy nowy chat w bazie
- Wiadomości zapisują się w bazie (nie tylko w localStorage)
- Po zalogowaniu na innym urządzeniu historia jest dostępna
- Można usunąć czat (DELETE /api/chats/:id)

---

### Sprint 3 — Streaming odpowiedzi & Deploy Phase 2

**Cel**: Odpowiedzi asystenta pojawiają się słowo po słowie (streaming SSE). Całość jest wdrożona na produkcję z migracją bazy danych.

**Technologie**: OpenAI streaming, `ReadableStream`, Server-Sent Events (SSE) lub chunked transfer, migracja Prismy na MySQL cyber_Folks, aktualizacja Vercel + Railway.

**Efekt końcowy**:

- Tekst odpowiedzi AI „pisze się” na żywo
- Baza danych na produkcji (MySQL na cyber_Folks)
- Migracje Prisma uruchomione na produkcji
- Backend wdrożony na Railway (GitHub auto-deploy)
- Pełna aplikacja Phase 2 dostępna online

---

## 📦 Nowe pakiety (do zainstalowania w toku sprintów)

### Backend

```bash
npm install bcrypt jsonwebtoken @prisma/client
npm install prisma --save-dev
npm install @types/bcrypt @types/jsonwebtoken --save-dev
```

### Frontend

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 🗄️ Schema bazy danych (Prisma)

```prisma
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
  user      User      @relation(fields: [userId], references: [id])
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  role      String   // "user" | "assistant"
  content   String   @db.Text
  openaiId  String?  // ID z OpenAI (previousResponseId)
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  createdAt DateTime @default(now())
}
```

> ⚠️ **Uwaga MySQL**: Pole `content` ma adnotację `@db.Text` — MySQL wymaga tego dla długich stringów (domyślny `VARCHAR(191)` mógłby ciąć długie odpowiedzi AI).

---

## ✅ Definition of Done — Phase 2

- [ ] Rejestracja i logowanie działają (formularz → request → token JWT)
- [ ] Chronione endpointy wymagają tokenu (401 bez tokenu)
- [ ] Wiadomości zapisywane w MySQL na cyber_Folks (nie w localStorage)
- [ ] Wiele chatów: tworzenie, lista, przełączanie, usuwanie
- [ ] Historia dostępna po zalogowaniu na innym urządzeniu
- [ ] Streaming — odpowiedź pojawia się sukcesywnie w UI
- [ ] Backend wdrożony na Railway (GitHub auto-deploy)
- [ ] Baza MySQL na cyber_Folks — port 3306 otwarty, migracje wykonane
- [ ] Frontend zaktualizowany na Vercel
- [ ] Brak błędów CORS, brak błędów w konsoli przeglądarki
