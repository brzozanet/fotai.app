# Phase 2: Konta Użytkowników & Wieloczatowość — FOTAI

> 🎯 **Cel Phase 2**: Dodanie pełnego systemu autentykacji, persystentnej historii rozmów w bazie danych i możliwości prowadzenia wielu niezależnych chatów.

**Timeframe**: ~3 sprinty (ok. 3-4 dni efektywnej pracy)  
**Status**: 🔄 W toku — Sprint 1 ukończony  
**Poziom**: Junior (brak doświadczenia z Prisma, MySQL, JWT, bcrypt — wszystkiego nauczysz się w toku pracy)

---

## 🗺️ Co zmienia się względem Phase 1?

| Obszar                  | Phase 1                               | Phase 2                                            |
| ----------------------- | ------------------------------------- | -------------------------------------------------- |
| Historia czatu          | localStorage (tylko jeden czat)       | MySQL — cyber_Folks (wiele chatów, wiele urządzeń) |
| Tożsamość użytkownika   | brak — wszyscy są anonimowi           | Rejestracja i logowanie (JWT + bcrypt) ✅          |
| Weryfikacja rejestracji | brak                                  | Cloudflare Turnstile CAPTCHA ✅                    |
| Trwałość danych         | Po wyczyszczeniu localStorage → brak  | Serwer → dane zawsze dostępne po zalogowaniu       |
| UI                      | Jeden czat                            | Panel z listą chatów + przełączanie                |
| Streaming odpowiedzi    | Cała odpowiedź naraz (po zakończeniu) | Słowa pojawiają się sukcesywnie (streaming)        |

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

### ⚙️ Krok 0 — Przed Sprint 1: Migracja Backend Render → Railway ✅

> **Czas**: ~30–60 min | **Kiedy**: przed pierwszą linią kodu Phase 2

**Dlaczego teraz?**  
Render zasypia po 15 min bezczynności (cold start ~30 s). Railway działa bez przerw na planie Hobby ($5/mies.) i będzie domem backendu przez całą Phase 2 oraz Phase 3.

**Kroki**:

1. ✅ Utwórz konto na railway.app i połącz z repozytorium GitHub
2. ✅ „New Project → Deploy from GitHub repo" → wybierz `fotai.app`
3. ✅ Ustaw „Root Directory" na `backend`
4. ✅ Dodaj zmienne środowiskowe: `OPENAI_API_KEY`, `FRONTEND_URL`, `PORT=3001` (i pozostałe z Render)
5. ✅ Skopiuj nowy URL Railway (np. `https://fotai-app-production.up.railway.app`)
6. ✅ Zaktualizuj `VITE_API_URL` w ustawieniach Vercel na nowy URL
7. ✅ Usuń serwis na Render

**Weryfikacja**: otwórz `<railway-url>/health` — powinno zwrócić `{ status: 'ok' }`. Przetestuj czat na stronie.

---

### Sprint 1 — Autentykacja ✅ Ukończony

**Cel**: Użytkownik może się zarejestrować i zalogować. Backend chroni endpointy tokenem JWT.

**Technologie**: `bcrypt`, `jsonwebtoken`, `Prisma` (User model, MySQL), `react-hook-form` + `zod`, Cloudflare Turnstile, `authStore` (Zustand + `persist`), localStorage dla tokenu.

**Local dev setup**: lokalna baza MariaDB działa przez `docker compose up -d` z rootowego `docker-compose.yml`, a dane są trzymane w named volume `fotai_mysql_data`.

**Efekt końcowy**:

- ✅ Działający formularz rejestracji i logowania w UI (`react-hook-form` + `zod`)
- ✅ Cloudflare Turnstile CAPTCHA przy rejestracji i logowaniu (ochrona przed botami)
- ✅ Backend wystawia token JWT po poprawnym logowaniu (ważność 7 dni)
- ✅ Hasła hashowane przez bcrypt — nigdy nie przechowywane w plaintext
- ✅ Chronione endpointy odrzucają request bez ważnego tokenu (401 Unauthorized)
- ✅ Użytkownik pozostaje zalogowany po odświeżeniu strony (token w localStorage)
- ✅ Przekierowanie niezalogowanych na `/login` (`ProtectedRoute`)
- ✅ Baza MySQL na cyber_Folks (produkcja) + MariaDB 10.6 Docker (development)
- ✅ Modele Prisma: `User`, `Chat`, `Message` z migracją `init`

---

### Sprint 2 — Tryb gościa & Streaming (planowany)

**Cel**: Odpowiedzi asystenta pojawiają się słowo po słowie. Niezalogowany użytkownik może zadać jedno pytanie próbne bez rejestracji — po odpowiedzi asystenta pojawia się zaproszenie do rejestracji.

**Technologie**: SSE streaming na istniejącym `/api/chat`, `ReadableStream` (frontend), `GUEST_QUESTION_LIMIT`, minimalne rozszerzenie `chatStore`.

**Efekt końcowy**:

- Niezalogowany użytkownik może zadać jedno pytanie bez rejestracji (tryb gościa)
- Po odpowiedzi asystenta: prompt logowania zamiast redirecta
- Odpowiedź asystenta pojawia się słowo po słowie (SSE streaming)
- Spinner podczas oczekiwania na pierwsze słowo

---

### Sprint 3 — Wieloczatowość (planowany)

**Cel**: Każda rozmowa jest zapisywana w MySQL. Użytkownik może tworzyć wiele chatów i przełączać się między nimi. Odpowiedzi zalogowanych użytkowników również streamowane (przez dedykowany endpoint).

**Technologie**: `Prisma` (Chat + Message models), REST API dla chatów, SSE streaming dla `/api/chats/:id/messages`, nowy widok Sidebar w UI, pełna przebudowa `chatStore`.

**Efekt końcowy**:

- Panel boczny (Sidebar) z listą chatów i przyciskiem „Nowy czat"
- Wiadomości zapisywane w MySQL (zamiast localStorage)
- Streaming odpowiedzi dla zalogowanych użytkowników
- Po zalogowaniu na innym urządzeniu historia jest dostępna
- Zarządzanie czatami: zmiana nazw, usuwanie (`DELETE /api/chats/:id`)
- Przełączanie między chatami

---

### Sprint 4 — Konto użytkownika & Deploy Phase 2 (planowany)

**Cel**: Użytkownik zarządza swoim kontem. Całość wdrożona na produkcję z migracją bazy danych.

**Technologie**: Prisma migracje na MySQL cyber_Folks, aktualizacja Vercel + Railway, integracja płatności (TBD).

**Efekt końcowy**:

- Zmiana danych użytkownika (email, hasło)
- Usuwanie konta
- Dostęp do usług premium (np. edycja zdjęć użytkownika)
- Zarządzanie sposobami płatności za usługi premium
- Baza danych na produkcji (MySQL na cyber_Folks) — migracje Prisma wykonane
- Backend wdrożony na Railway (GitHub auto-deploy)
- Pełna aplikacja Phase 2 dostępna online

---

## 📦 Pakiety — stan instalacji

### Backend

```bash
# ✅ Zainstalowane (Sprint 1)
npm install bcrypt jsonwebtoken @prisma/client
npm install prisma --save-dev
npm install @types/bcrypt @types/jsonwebtoken --save-dev
```

### Frontend

```bash
# ✅ Zainstalowane (Sprint 1)
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
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  role      String   // "user" | "assistant"
  content   String   @db.Text
  openaiId  String?  // ID z OpenAI (previousResponseId)
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

> ⚠️ **Uwaga MySQL**: Pole `content` ma adnotację `@db.Text` — MySQL wymaga tego dla długich stringów (domyślny `VARCHAR(191)` mógłby ciąć długie odpowiedzi AI).
>
> ℹ️ `onDelete: Cascade` — usunięcie użytkownika automatycznie usuwa jego chaty i wiadomości (brak osieroconych rekordów).

---

## ✅ Definition of Done — Phase 2

### Sprint 1 — Autentykacja ✅

- [x] Rejestracja i logowanie działają (formularz → request → token JWT)
- [x] Weryfikacja Cloudflare Turnstile przy rejestracji i logowaniu
- [x] Chronione endpointy wymagają tokenu (401 bez tokenu)
- [x] Hasła hashowane bcrypt — brak plaintext w bazie
- [x] Token JWT w localStorage — user pozostaje zalogowany po odświeżeniu
- [x] ProtectedRoute — niezalogowani przekierowywani na `/login`
- [x] Baza MySQL na cyber_Folks — migracja `init` wykonana
- [x] Lokalna baza MariaDB 10.6 na Docker — `docker compose up -d`

### Sprint 2 — Tryb gościa & Streaming

- [ ] Streaming odpowiedzi asystenta (tekst pojawia się sukcesywnie) dla niezalogowanych
- [ ] Tryb gościa: jedno pytanie bez logowania, prompt logowania po odpowiedzi
- [ ] Spinner podczas oczekiwania na pierwsze słowo odpowiedzi

### Sprint 3 — Wieloczatowość

- [ ] Wiadomości zapisywane w MySQL na cyber_Folks (nie w localStorage)
- [ ] Streaming odpowiedzi dla zalogowanych użytkowników (SSE)
- [ ] Wiele chatów: tworzenie, lista, przełączanie
- [ ] Zarządzanie czatami: zmiana nazwy, usuwanie
- [ ] Historia dostępna po zalogowaniu na innym urządzeniu

### Sprint 4 — Konto użytkownika

- [ ] Zmiana danych użytkownika (email, hasło)
- [ ] Usuwanie konta
