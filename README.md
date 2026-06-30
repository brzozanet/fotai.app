# 📸 FOTAI — AI Photography Assistant

![Screenshot App](https://raw.githubusercontent.com/brzozanet/fotai.app/refs/heads/main/frontend/public/images/gh-cover-fotai-v02.png)

### Inteligentny asystent fotograficzny oparty na OpenAI

FOTAI to **aplikacja webowa z AI asystentem** specjalizującym się w **fotografii**. Asystent udziela porad na temat techniki fotograficznej, kompozycji, wyboru sprzętu, obróbki zdjęć i fotografii specjalistycznej, a na końcu każdej odpowiedzi zaprasza na warsztaty: [fotowarsztaty.com](https://fotowarsztaty.com).

**Geneza**: Projekt bazuje na prostej implementacji czatu AI w terminalu ([example.ts](./example.ts)), która wykorzystuje OpenAI API z zachowaniem historii rozmowy (`previous_response_id`). Celem była transformacja tego rozwiązania w pełnoprawne MVP webowe.

**Cel**: Szybkie stworzenie działającego MVP (czat + deploy), następnie iteracyjna rozbudowa o nowe feature'y.

**Zastosowanie**: Projekt portfolio — demonstracja umiejętności: React, TypeScript, Express.js, OpenAI API integration, deployment (Vercel + Railway), UI/UX.

---

## 🌐 Demo

### 🚀 Wersja online

Aplikacja jest dostępna online pod adresem:

👉 [https://fotai.app](https://fotai.app)

**Testowe dane dostępowe:**

Login:

```
test@example.com
```

Hasło:

```
fotaitest
```

Platformy:

- **Frontend**: [Vercel](https://vercel.com/) — hosting React / Vite
- **Backend**: [Railway](https://railway.app/) — hosting Express.js API

### 📦 Architektura

Aplikacja składa się z trzech warstw:

- **Frontend**: React + Vite — hostowany na Vercel
- **Backend**: Express.js API — hostowany na Railway
- **Baza danych**: MySQL — hosting [cyber_Folks](https://cyber-folks.pl) (produkcja) / Docker MariaDB 10.6 (development)

---

## 💡 Jak działa asystent?

### OpenAI Responses API

Backend komunikuje się z OpenAI poprzez endpoint `/api/chat`. Kluczową cechą jest zachowanie historii rozmowy dzięki `previous_response_id`:

```typescript
const chatRequest = await client.responses.create({
  model: process.env.OPENAI_MODEL,
  previous_response_id: previousResponseId, // historia rozmowy
  input: [
    { role: "user", content: message },
    { role: "system", content: SYSTEM_PROMPT },
  ],
});
```

Każda odpowiedź OpenAI zwraca unikalne `id`, które frontend zapisuje w Zustand store i przekazuje w kolejnym requeście. Dzięki temu model „pamięta" kontekst całej rozmowy bez przesyłania pełnej historii.

### System Prompt

System prompt to „instrukcja" dla modelu AI ustawiająca jego osobowość i zachowanie. Konfigurowany jest w zmiennej środowiskowej `SYSTEM_PROMPT` po stronie backendu.

Asystent działa jako **ekspert fotografii z 20+ latami doświadczenia**:

- Odpowiada na pytania o technikę (ekspozycja, przesłona, ISO, ogniskowa)
- Pomaga w kompozycji i estetyce zdjęć
- Doradza w wyborze sprzętu (aparaty, obiektywy, oświetlenie)
- Wyjaśnia obróbkę zdjęć (Lightroom, Photoshop, RawTherapee)
- Dostosowuje poziom odpowiedzi do początkujących i zaawansowanych
- Na końcu każdej odpowiedzi zaprasza na tematyczne warsztaty: [fotowarsztaty.com](https://fotowarsztaty.com)

---

## 🛠 Tech Stack

### Frontend

- **React 19** + **Vite** — framework i bundler
- **TypeScript** — pełne typowanie
- **TailwindCSS v4** — stylowanie
- **Shadcn/ui** + **Radix UI** — komponenty UI
- **Zustand** + `persist` middleware — zarządzanie stanem + localStorage
- **React Router DOM v7** — routing
- **react-hook-form** + **zod** — zarządzanie formularzami i walidacja
- **react-markdown** — renderowanie odpowiedzi AI jako Markdown
- **nanoid** — generowanie unikalnych ID wiadomości
- **lucide-react** — ikony
- **Cloudflare Turnstile** — weryfikacja CAPTCHA przy rejestracji i logowaniu

### Backend

- **Express.js v5** + **TypeScript** — serwer API
- **OpenAI SDK** — integracja z OpenAI Responses API
- **Prisma ORM** — ORM + migracje bazy danych (MySQL)
- **bcrypt** — hashowanie haseł użytkowników
- **jsonwebtoken** — generowanie i weryfikacja tokenów JWT
- **cors** — konfiguracja CORS (Vercel ↔ Railway)
- **dotenv** — zmienne środowiskowe
- **chalk** — kolorowe logi w terminalu
- **tsx** + **nodemon** — narzędzia deweloperskie

### Baza danych

- **MySQL** (cyber_Folks shared hosting) — produkcja
- **MariaDB 10.6** (Docker) — lokalny development i testy
- **Prisma Studio** — GUI do przeglądania i zarządzania bazą

### Narzędzia

- **Git & GitHub** — kontrola wersji
- **Docker** — lokalna baza danych MariaDB 10.6
- **Vercel** — CI/CD i hosting frontend
- **Railway** — hosting backend

---

## 📂 Struktura projektu

```
fotai.app/
├── frontend/                        # Aplikacja React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── ProtectedRoute.tsx  # Ochrona tras — redirect niezalogowanych
│   │   │   │   └── TurnstileWidget.tsx # Cloudflare Turnstile CAPTCHA
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx          # Logo + nawigacja + przycisk wyloguj
│   │   │   │   ├── Footer.tsx          # Stopka
│   │   │   │   ├── Layout.tsx          # Wrapper całej aplikacji
│   │   │   │   ├── ChatWindow.tsx      # Kontener: MessageList + ChatInput
│   │   │   │   └── EmptyChat.tsx       # Widok pustego czatu
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx       # Textarea + przycisk wyślij
│   │   │   │   ├── Message.tsx         # Pojedynczy bąbelek wiadomości (Markdown)
│   │   │   │   └── MessageList.tsx     # Lista wiadomości + auto-scroll
│   │   │   └── ui/                 # Komponenty Shadcn/ui
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Główna strona z czatem
│   │   │   ├── LoginPage.tsx       # /login — formularz logowania
│   │   │   ├── RegisterPage.tsx    # /register — formularz rejestracji
│   │   │   ├── AboutPage.tsx       # /about
│   │   │   └── HowItWorksPage.tsx  # /how-it-works
│   │   ├── services/
│   │   │   ├── authService.ts      # HTTP client: register(), login()
│   │   │   └── chatService.ts      # HTTP client (fetch POST /api/chat)
│   │   ├── store/
│   │   │   ├── authStore.ts        # Zustand: token JWT + dane usera + persist
│   │   │   └── chatStore.ts        # Zustand store + localStorage persist
│   │   ├── types/
│   │   │   ├── auth.ts             # Typy: AuthUser, AuthResponse, AuthError
│   │   │   └── chat.ts             # Typy TypeScript (Message, ChatRequest, etc.)
│   │   ├── lib/
│   │   │   └── utils.ts            # Helper: cn() do łączenia klas Tailwind
│   │   └── index.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                         # Express.js API
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts             # authMiddleware — weryfikacja tokenu JWT
│   │   ├── routes/
│   │   │   ├── auth.ts             # POST /api/auth/register, POST /api/auth/login
│   │   │   └── chat.ts             # Endpoint POST /api/chat
│   │   ├── lib/
│   │   │   └── prisma.ts           # Singleton klienta Prismy
│   │   ├── types/
│   │   │   ├── auth.ts             # Typy: RegisterRequest, LoginRequest, AuthResponse
│   │   │   └── express.d.ts        # Rozszerzenie typów Express (req.user)
│   │   └── index.ts                # Express server + CORS + middleware
│   ├── prisma/
│   │   ├── schema.prisma           # Modele: User, Chat, Message
│   │   └── migrations/             # Historia migracji bazy danych
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml               # Lokalna baza MariaDB 10.6
├── example.ts                       # Oryginalna implementacja CLI (geneza projektu)
└── README.md
```

---

## 🌐 API Endpoints

### Autentykacja

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "jan@example.com",
  "password": "tajne1234"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "clob...", "email": "jan@example.com" }
}
```

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "jan@example.com",
  "password": "tajne1234"
}
```

---

### Chat

```
POST /api/chat
```

**Request Body:**

```json
{
  "message": "Jak robić zdjęcia nocne bez tripodu?",
  "previousResponseId": "resp_abc123..."
}
```

`previousResponseId` jest opcjonalne — wymagane od drugiej wiadomości w rozmowie.

**Response:**

```json
{
  "id": "resp_xyz789...",
  "message": "Do fotografii nocnej bez tripodu rekomenduje...",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

**Health check:**

```
GET /health
```

---

## 📝 Zmienne środowiskowe

### Backend (`backend/.env`)

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
PORT=3001
NODE_ENV=development
# Lokalna baza (Docker MariaDB):
DATABASE_URL=mysql://root:TWOJE_LOKALNE_HASLO@localhost:3306/fotai_dev
# Produkcja (cyber_Folks shared hosting):
# DATABASE_URL=mysql://db_user:db_password@s53.cyber-folks.pl:3306/db_name
JWT_SECRET=change-me-to-long-random-string
FRONTEND_URL=http://localhost:3000
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
SYSTEM_PROMPT=Jesteś ekspertem w fotografii...
```

### Docker Compose (`./.env` + `docker-compose.yml`)

Lokalna baza MariaDB jest opisana w [docker-compose.yml](./docker-compose.yml), a wartości dla Compose są trzymane w rootowym pliku `.env`:

```env
MYSQL_ROOT_PASSWORD=twoje-lokalne-haslo
MYSQL_DATABASE=fotai_dev
MYSQL_PORT=3306
```

Najpierw skopiuj przykład do pliku roboczego:

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

Compose używa też named volume `fotai_mysql_data`, więc dane MariaDB nie znikają po zwykłym zatrzymaniu lub odtworzeniu kontenera.

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3001
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
```

---

## 🚀 Jak uruchomić projekt lokalnie

### Wymagania

- Node.js (wersja LTS)
- npm
- Docker Desktop lub Docker Engine
- Klucz OpenAI API (→ [platform.openai.com](https://platform.openai.com))

### Instalacja

1. **Sklonuj repozytorium:**

```bash
git clone https://github.com/brzozanet/fotai.app.git
cd fotai.app
```

2. **Zainstaluj zależności (oba workspace'y):**

```bash
npm install
```

3. **Uruchom lokalną bazę danych przez Docker Compose:**

```bash
docker compose up -d
```

To polecenie stawia MariaDB 10.6, mapuje port `3306` i zapisuje dane w named volume `fotai_mysql_data`, więc baza przetrwa restart kontenera.

4. **Skonfiguruj zmienne środowiskowe backendu:**

```bash
# Plik backend/.env jest już przygotowany pod lokalny development.
# Uzupełnij w nim co najmniej OPENAI_API_KEY i docelowy JWT_SECRET.
```

5. **Skonfiguruj zmienne środowiskowe frontendu:**

```bash
# Plik frontend/.env.local jest już przygotowany.
```

6. **Uruchom backend** (terminal 1):

```bash
cd backend
npm run dev
# Nasłuchuje na http://localhost:3001
```

7. **Uruchom frontend** (terminal 2):

```bash
cd frontend
npm run dev
# Nasłuchuje na http://localhost:5173
```

Otwórz **[http://localhost:3000](http://localhost:3000)** w przeglądarce.

---

## ✨ Funkcjonalności

> ℹ️ **Dostęp do aplikacji wymaga zalogowania.** Konto możesz założyć samodzielnie pod adresem [fotai.app/register](https://fotai.app/register) lub użyć danych testowych: **login:** `test@example.com` / **hasło:** `fotaitest`

### Phase 1 — MVP

- 💬 Czat z AI Photography Assistant w czasie rzeczywistym
- 🧠 Zachowanie historii rozmowy (`previous_response_id`) — model pamięta kontekst
- 💾 Persystencja czatu w `localStorage` (historia przeżyje odświeżenie strony)
- 📝 Renderowanie odpowiedzi AI jako Markdown (nagłówki, listy, bold, linki)
- ⏳ Loading state podczas oczekiwania na odpowiedź AI
- 🗑️ Czyszczenie historii czatu
- 📱 Responsywny design (mobile-first)
- 🌍 Routing: strona główna, /about, /how-it-works
- 🔐 Klucz API wyłącznie po stronie serwera — bezpieczna architektura proxy

### Phase 2 Sprint 1 — Autentykacja

- 👤 Rejestracja i logowanie użytkowników (email + hasło)
- 🔒 Hasła hashowane algorytmem bcrypt — nigdy nie przechowywane w plaintext
- 🪙 Sesja oparta na tokenach JWT — przechowywanych w localStorage
- 🤖 Weryfikacja Cloudflare Turnstile przy rejestracji i logowaniu (ochrona przed botami)
- 🛡️ Middleware JWT — chronione endpointy zwracają 401 bez ważnego tokenu
- 🗄️ Baza danych MySQL z modelami `User`, `Chat`, `Message` (Prisma ORM)
- ↩️ Przekierowanie niezalogowanych na `/login` (`ProtectedRoute`)
- 🔄 Po odświeżeniu strony użytkownik pozostaje zalogowany

---

## 📈 Fazy rozwoju

| Faza              | Cel                                               | Status       |
| ----------------- | ------------------------------------------------- | ------------ |
| **Phase 1 (MVP)** | Czat z AI + deploy na produkcję                   | ✅ Ukończona |
| **Phase 2**       | Konta użytkowników, historia chatów, wiele rozmów | 🔄 W toku    |
| **Phase 3**       | Migracja: Next.js App Router, CI/CD, testy E2E    | 📅 Planowana |
| **Phase 4**       | Analiza zdjęć AI + model premium + storage        | 📅 Planowana |
| **Phase 5**       | Edycja zdjęć AI, kamera, reader EXIF              | 📅 Planowana |
| **Phase 6**       | Społeczność, galeria, PWA, Realtime               | 📅 Planowana |
| **Phase 7**       | Jakość: a11y, performance, rozszerzenie testów    | 📅 Planowana |

---

## 🔄 Co będzie rozwijane następnie

### Phase 2 Sprint 2 — Tryb gościa & Streaming (w realizacji)

- Streaming odpowiedzi asystenta w czasie rzeczywistym (tekst pojawia się słowo po słowie)
- Tryb gościa: jedno pytanie bez logowania, prompt logowania po odpowiedzi
- Spinner podczas oczekiwania na pierwsze słowo

### Phase 2 Sprint 3 — Wieloczatowość (planowane)

- Sidebar z listą chatów i przyciskiem „Nowy czat"
- Endpointy REST dla chatów: `GET/POST/PATCH/DELETE /api/chats`
- Wiadomości zapisywane w MySQL (zamiast localStorage)
- Streaming dla zalogowanych użytkowników (SSE przez `/api/chats/:id/messages`)
- Przełączanie i zarządzanie chatami (zmiana nazw, usuwanie)
- Historia chatów dostępna po zalogowaniu na dowolnym urządzeniu

### Phase 2 Sprint 4 — Konto użytkownika (planowane)

- Zmiana danych użytkownika (email, hasło, nazwa wyświetlana)
- Usuwanie konta z potwierdzeniem przez wpisanie hasła
- Opcjonalnie: reset/przypomnienie hasła przez email

### Phase 3: Migracja (planowane)

- React + Vite → **Next.js App Router** (SSR, `next/image`, OG meta tags)
- **GitHub Actions CI/CD** — lint, type check, build na każdym PR
- **Playwright E2E tests** — krytyczne przepływy (rejestracja, czat, profil)
- Opcjonalnie: MySQL (cyber_Folks) → Supabase PostgreSQL

### Phase 4: Analiza Zdjęć AI + Premium (planowane)

- Upload zdjęcia → AI analizuje (kompozycja, ekspozycja, błędy) — funkcja premium
- Model premium: subskrypcja miesięczna lub pay-per-use (Stripe)
- Zarządzanie płatnościami i sposobami płatności
- Storage zdjęć: Supabase Storage lub Cloudflare R2

### Phase 5: Edycja Zdjęć AI (planowane)

- Komendami tekstowymi: „usuń drzewo", „dodaj chmury" → DALL-E inpainting — funkcja premium
- Widok before/after + eksport edytowanego zdjęcia
- Camera integration — zdjęcie bezpośrednio z kamery urządzenia
- EXIF reader — automatyczne odczytanie metadanych zdjęcia (ISO, ogniskowa, GPS)

### Phase 6: Społeczność (planowane)

- Galeria publiczna zdjęć użytkowników + portfolio fotograficzne
- Udostępnianie rozmów — publiczny link `/share/[id]` (read-only)
- Wyszukiwanie w historii chatów (full-text search)
- Supabase Realtime — live notifications, typing indicators
- PWA — aplikacja instalowalna na telefonie, działa offline

### Phase 7: Jakość (planowane)

- Accessibility (WCAG 2.1 AA) — screen reader, keyboard navigation
- Performance — Core Web Vitals, Lighthouse score ≥ 90
- Rozszerzone testy Playwright — pełne pokrycie krytycznych przepływów

---

**Status**: 🔄 Phase 2 w toku — Sprint 1 (autentykacja) ukończony  
**Live demo**: [https://fotai.app](https://fotai.app)  
**Ostatnia aktualizacja**: 29.06.2026
