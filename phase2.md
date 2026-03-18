# Phase 2: Konta Użytkowników & Wieloczatowość — FOTAI

> 🎯 **Cel Phase 2**: Dodanie pełnego systemu autentykacji, persystentnej historii rozmów w bazie danych i możliwości prowadzenia wielu niezależnych chatów.

**Timeframe**: ~3 sprinty (ok. 3-4 dni efektywnej pracy)
**Poziom**: Junior (brak doświadczenia z Prisma, PostgreSQL, JWT, bcrypt — wszystkiego nauczysz się w toku pracy)

---

## 🗺️ Co zmienia się względem Phase 1?

| Obszar                | Phase 1                               | Phase 2                                      |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| Historia czatu        | localStorage (tylko jeden czat)       | PostgreSQL (wiele chatów, wiele urządzeń)    |
| Tożsamość użytkownika | brak — wszyscy są anonimowi           | Rejestracja i logowanie (JWT + bcrypt)       |
| Trwałość danych       | Po wyczyszczeniu localStorage → brak  | Serwer → dane zawsze dostępne po zalogowaniu |
| UI                    | Jeden czat                            | Panel z listą chatów + przełączanie          |
| Streaming odpowiedzi  | Cała odpowiedź naraz (po zakończeniu) | Słowa pojawiają się sukcesywnie (streaming)  |

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
│  BACKEND (Render)                                           │
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
│  POSTGRESQL (Render Postgres / Supabase)                    │
│                                                             │
│  users    { id, email, passwordHash, createdAt }            │
│  chats    { id, title, userId, createdAt }                  │
│  messages { id, role, content, chatId, openaiId, createdAt }│
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Podział na Sprinty

### Sprint 1 — Autentykacja (register/login/JWT/bcrypt)

**Cel**: Użytkownik może się zarejestrować i zalogować. Backend chroni endpointy tokenem JWT.

**Technologie**: `bcrypt`, `jsonwebtoken`, `Prisma` (User model), React forms, `authStore` (Zustand), localStorage dla tokenu.

**Efekt końcowy**:

- Działający formularz rejestracji i logowania w UI
- Backend wystawia token JWT po poprawnym logowaniu
- Chronione endpointy odrzucają request bez ważnego tokenu (401 Unauthorized)
- Użytkownik pozostaje zalogowany po odświeżeniu strony (token w localStorage)

---

### Sprint 2 — Danych w bazie & Wieloczatowość

**Cel**: Każda rozmowa jest zapisywana w PostgreSQL. Użytkownik może tworzyć wiele chatów i przełączać się między nimi.

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

**Technologie**: OpenAI streaming, `ReadableStream`, Server-Sent Events (SSE) lub chunked transfer, aktualizacja Vercel + Render.

**Efekt końcowy**:

- Tekst odpowiedzi AI "pisze się" na żywo
- Baza danych na produkcji (Render PostgreSQL lub Supabase)
- Migracje Prisma uruchomione na produkcji
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
  content   String
  openaiId  String?  // ID z OpenAI (previousResponseId)
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  createdAt DateTime @default(now())
}
```

---

## ✅ Definition of Done — Phase 2

- [ ] Rejestracja i logowanie działają (formularz → request → token JWT)
- [ ] Chronione endpointy wymagają tokenu (401 bez tokenu)
- [ ] Wiadomości zapisywane w PostgreSQL (nie w localStorage)
- [ ] Wiele chatów: tworzenie, lista, przełączanie, usuwanie
- [ ] Historia dostępna po zalogowaniu na innym urządzeniu
- [ ] Streaming — odpowiedź pojawia się sukcesywnie w UI
- [ ] Backend i baza danych wdrożone na produkcję
- [ ] Frontend zaktualizowany na Vercel
- [ ] Brak błędów CORS, brak błędów w konsoli przeglądarki
