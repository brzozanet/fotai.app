# Phase 3: Migracja — FOTAI

> 🎯 **Cel Phase 3**: Migracja techniczna całego stacku bez dodawania nowych funkcji dla użytkownika. Efektem jest nowoczesna architektura gotowa na Phase 4+ i portfolio demonstrujące znajomość Next.js App Router.

**Timeframe**: ~3 sprinty (ok. 3–5 dni efektywnej pracy)  
**Status**: 📅 Planowana  
**Poziom**: Junior-Mid — pierwsza poważna migracja frameworka + infrastruktura DevOps

---

## 🗺️ Co zmienia się względem Phase 2?

| Obszar                | Phase 2                              | Phase 3                                       |
| --------------------- | ------------------------------------ | --------------------------------------------- |
| Frontend framework    | React 19 + Vite                      | **Next.js App Router** (SSR, `next/image`)    |
| Routing               | React Router DOM v7 (CSR)            | Next.js file-based routing (App Router)       |
| Renderowanie          | Client-Side Rendering (CSR)          | SSR / SSG / ISR do wyboru per strona          |
| SEO                   | Brak (SPA, puste `<head>`)           | Pełne `metadata`, OG images, sitemap          |
| CI/CD                 | Ręczny deploy (Vercel auto od main)  | **GitHub Actions** — lint + type check na PR  |
| Testy                 | Manualne                             | **Playwright E2E** — krytyczne przepływy      |
| Optymalizacja obrazów | `<img>` natywny (brak optymalizacji) | `next/image` (WebP, AVIF, lazy, placeholder)  |
| Backend               | Express.js na Railway (bez zmian)    | Express.js na Railway — bez zmian             |
| Baza danych           | MySQL na cyber_Folks                 | MySQL (bez zmian) **lub** Supabase PostgreSQL |

---

## 🏗️ Architektura po Phase 3

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                          │
│  Next.js 15 App Router + TailwindCSS + Shadcn/ui            │
│                                                             │
│  app/                                                       │
│  ├── (auth)/login/page.tsx      ← Server Component          │
│  ├── (auth)/register/page.tsx   ← Server Component          │
│  ├── (app)/page.tsx             ← Client Component (czat)   │
│  ├── (app)/account/page.tsx     ← Client Component          │
│  ├── layout.tsx                 ← Root Layout               │
│  └── middleware.ts              ← JWT check (Edge Runtime)  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + Authorization: Bearer <token>
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Railway) — BEZ ZMIAN                              │
│  Express.js + TypeScript                                    │
│  Wszystkie endpointy zachowane                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│  BAZA DANYCH                                                │
│  Opcja A: MySQL (cyber_Folks) — bez zmian                   │
│  Opcja B: PostgreSQL (Supabase) — migracja w Sprint 3       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Podział na Sprinty

### Sprint 1 — Migracja React → Next.js App Router

> **Czas**: 1–2 dni | **Trudność**: wysoka (zmiana paradygmatu)

**Cel**: Przepisanie frontendu z Vite+React na Next.js App Router. Backend (Express.js) pozostaje bez zmian — Next.js komunikuje się z nim tak samo jak Vite.

**Kluczowe koncepty do opanowania**:

- `app/` directory vs `pages/` (App Router vs Pages Router — używamy App Router)
- Server Components vs Client Components (`"use client"` directive)
- `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`
- `next/image` zamiast `<img>`
- `metadata` API dla SEO
- `middleware.ts` dla ochrony tras (zastępuje `ProtectedRoute`)

**Główne zadania**:

- [ ] Inicjalizacja nowego projektu Next.js (`npx create-next-app@latest`)
- [ ] Konfiguracja `next.config.ts` (domeny backendu, rewrites)
- [ ] Przeniesienie wszystkich stron do `app/` directory
- [ ] Oznaczenie komponentów używających React hooks jako `"use client"`
- [ ] Zastąpienie React Router → Next.js routing (`useRouter`, `Link`, `redirect`)
- [ ] Middleware JWT (`middleware.ts`) — ochrona tras na Edge Runtime
- [ ] Zastąpienie `<img>` → `next/image` (kluczowe dla Phase 4 ze zdjęciami)
- [ ] Konfiguracja `metadata` dla każdej strony
- [ ] Deploy na Vercel + weryfikacja że wszystko działa

**Efekt końcowy**: Aplikacja działa identycznie jak przed migracją, ale na Next.js. Vercel może teraz używać SSR gdzie potrzeba.

---

### Sprint 2 — CI/CD + Playwright E2E

> **Czas**: 1 dzień | **Trudność**: średnia

**Cel**: Automatyzacja jakości kodu przez GitHub Actions i pierwsze testy E2E z Playwright. Po tym sprincie każdy PR automatycznie przechodzi przez lint, type check i testy.

**GitHub Actions — co to jest?**  
YAML-owe pliki w `.github/workflows/` definiujące co i kiedy uruchomić automatycznie. Np. na każdy `push` do `main` lub otwarcie PR → uruchom testy.

**Główne zadania**:

- [ ] `.github/workflows/ci.yml` — na każdym PR: `tsc --noEmit`, `eslint`, `next build`
- [ ] `.github/workflows/deploy.yml` — na push do `main`: deploy do Vercel (lub auto-deploy Vercel)
- [ ] Instalacja i konfiguracja Playwright (`npx playwright install`)
- [ ] Plik `playwright.config.ts` — base URL, browser targets
- [ ] Testy E2E (minimum 6–8 krytycznych przepływów):
  - Rejestracja nowego użytkownika
  - Logowanie + wylogowanie
  - Tryb gościa (pytanie bez logowania)
  - Wysłanie wiadomości (zalogowany)
  - Stworzenie i usunięcie czatu
  - Zmiana nazwy w ustawieniach konta
- [ ] `package.json` scripts: `test:e2e`, `test:e2e:ui`

**Efekt końcowy**: Każdy push do main przechodzi przez zautomatyzowane sprawdzenie. Testy E2E uruchamiają się lokalnie i w CI.

---

### Sprint 3 — Migracja bazy danych (warunkowy)

> **Czas**: 0.5–1 dzień | **Kiedy**: tylko jeśli decydujesz się na Supabase  
> **Możliwe pominięcie**: jeśli zostajesz przy MySQL na cyber_Folks

**Decyzja do podjęcia przed sprintem**:

```
MySQL (cyber_Folks) ─── zostaje ───→  nic nie robisz, skip Sprint 3
PostgreSQL (Supabase) ─ migrujesz →  wykonujesz Sprint 3
```

**Kiedy warto migrować do Supabase?**

- Planujesz używać Supabase Storage w Phase 4 (spójny ekosystem)
- Chcesz Supabase Realtime w Phase 6
- Chcesz PostgreSQL na CV (bardziej powszechny w ofertach pracy)

**Kiedy zostać przy MySQL?**

- cyber_Folks już opłacony, działa stabilnie
- Nie planujesz Supabase Storage (używasz Cloudflare R2)
- Nie chcesz kolejnej zmiany po migracji Next.js

**Główne zadania (jeśli migrujesz)**:

- [ ] Utwórz projekt w [Supabase](https://supabase.com) (darmowy plan: 500 MB DB, 1 GB Storage)
- [ ] Zmień `datasource provider` w `schema.prisma`: `mysql` → `postgresql`
- [ ] Zaktualizuj `DATABASE_URL` w `.env` i zmiennych Railway/Vercel
- [ ] `npx prisma migrate reset` + `npx prisma migrate deploy` na nowej bazie
- [ ] Weryfikacja: Prisma Studio + testy manualne
- [ ] Opcjonalnie: konfiguracja Supabase Storage (prereq dla Phase 4)

---

## 📦 Nowe pakiety (do zainstalowania w toku sprintów)

### Sprint 1 — Next.js

```bash
# Nowy projekt (zamiast obecnego frontend/)
npx create-next-app@latest fotai-next --typescript --tailwind --eslint --app

# Przeniesienie istniejących pakietów:
npm install zustand @hookform/resolvers zod react-hook-form
npm install react-markdown lucide-react nanoid
npm install @radix-ui/react-alert-dialog  # lub cały shadcn/ui setup
```

### Sprint 2 — CI/CD + Playwright

```bash
# Playwright (w projekcie frontend/root)
npm install -D @playwright/test
npx playwright install  # pobiera przeglądarki
```

### Sprint 3 — Supabase (opcjonalnie)

```bash
# Jeśli używasz Supabase Storage w Phase 4
npm install @supabase/supabase-js
```

---

## 🗄️ Zmiany w schemacie bazy (Sprint 3 — opcjonalne)

Jeśli migrujesz do PostgreSQL, jedyną zmianą w `schema.prisma` jest:

```prisma
datasource db {
  provider = "postgresql"  // ← było: "mysql"
  url      = env("DATABASE_URL")
}

model Message {
  // ...
  content   String   // ← @db.Text nie jest potrzebne w PostgreSQL
  // ...
}
```

> ℹ️ `@db.Text` jest adnotacją MySQL-specyficzną. PostgreSQL domyślnie obsługuje nieograniczone `String` — można ją usunąć po migracji.

---

## ✅ Definition of Done — Phase 3

### Sprint 1 — Next.js Migration

- [ ] Aplikacja działa identycznie na Next.js App Router
- [ ] Server Components tam gdzie możliwe, `"use client"` tylko gdzie konieczne
- [ ] `middleware.ts` chroni trasy wymagające logowania
- [ ] `next/image` używany dla wszystkich obrazów
- [ ] `metadata` skonfigurowane dla głównych stron
- [ ] Deploy na Vercel działa automatycznie

### Sprint 2 — CI/CD + Tests

- [ ] GitHub Actions: `ci.yml` uruchamia się na każdym PR
- [ ] TypeScript type check: `tsc --noEmit` przechodzi w CI
- [ ] ESLint: `next lint` przechodzi w CI
- [ ] Playwright: minimum 6 testów krytycznych przepływów
- [ ] `npm run test:e2e` działa lokalnie

### Sprint 3 — Baza (warunkowy)

- [ ] PostgreSQL (Supabase) działa z Prisma ORM
- [ ] Migracje wykonane na nowej bazie
- [ ] Stara baza MySQL (cyber_Folks) może zostać wyłączona
- [ ] Opcjonalnie: Supabase Storage skonfigurowane jako prereq Phase 4

---

## 🔑 Kluczowe decyzje przed Phase 3

### 1. Kiedy zacząć Phase 3?

Dopiero po ukończeniu **Phase 2 Sprint 4** (konto użytkownika). Phase 3 to migracja stabilnej, kompletnej aplikacji — nie warto migrować "w trakcie" budowania funkcji.

### 2. MySQL czy PostgreSQL?

Jeśli decydujesz się na Supabase Storage dla zdjęć w Phase 4 → migruj bazę w Sprint 3.  
Jeśli decydujesz się na Cloudflare R2 dla zdjęć → zostań przy MySQL, skip Sprint 3.

### 3. Czy przepisywać API routes do Next.js?

**Nie rekomendowane** dla tego projektu. Zachowaj Express.js na Railway — ma sens dla:

- Endpointów SSE (streaming) — Next.js API routes mają limity czasu
- Prisma singleton — łatwiej zarządzać na dedykowanym serwerze
- Railway jest tańsze niż serverless dla długo działających połączeń

### 4. Czy Pages Router zamiast App Router?

**Nie** — App Router to obecny standard (Next.js 13+). Pages Router to legacy. Dla portfolio zdecydowanie App Router.

---

## 🚀 Co dalej? Phase 4 — Analiza Zdjęć AI + Premium

Po ukończeniu Phase 3 (stabilny, nowoczesny stack), Phase 4 wprowadza:

- Upload zdjęć i analizę przez GPT-4 Vision
- Model premium (subskrypcja lub pay-per-use)
- Storage zdjęć (Supabase Storage lub Cloudflare R2)
