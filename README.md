# 📸 FOTAI — AI Photography Assistant

![Screenshot App](https://raw.githubusercontent.com/brzozanet/fotai.app/refs/heads/main/frontend/public/images/gh-cover-fotai-v1.png)

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

Platformy:

- **Frontend**: [Vercel](https://vercel.com/) — hosting React / Vite
- **Backend**: [Railway](https://railway.app/) — hosting Express.js API

### 📦 Architektura

Aplikacja składa się z dwóch części:

- **Frontend**: React + Vite — hostowany na Vercel
- **Backend**: Express.js (proxy do OpenAI API) — hostowany na Railway

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
- **react-markdown** — renderowanie odpowiedzi AI jako Markdown
- **nanoid** — generowanie unikalnych ID wiadomości
- **lucide-react** — ikony

### Backend

- **Express.js v5** + **TypeScript** — serwer proxy
- **OpenAI SDK** — integracja z OpenAI Responses API
- **cors** — konfiguracja CORS (Vercel ↔ Render)
- **dotenv** — zmienne środowiskowe
- **chalk** — kolorowe logi w terminalu
- **tsx** + **nodemon** — narzędzia deweloperskie

### Narzędzia

- **Git & GitHub** — kontrola wersji
- **Vercel** — CI/CD i hosting frontend
- **Render** — hosting backend

---

## 📂 Struktura projektu

```
fotai.app/
├── frontend/                        # Aplikacja React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx          # Logo + nawigacja
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
│   │   │   ├── AboutPage.tsx       # /about
│   │   │   └── HowItWorksPage.tsx  # /how-it-works
│   │   ├── services/
│   │   │   └── chatService.ts      # HTTP client (fetch POST /api/chat)
│   │   ├── store/
│   │   │   └── chatStore.ts        # Zustand store + localStorage persist
│   │   ├── types/
│   │   │   └── chat.ts             # Typy TypeScript (Message, ChatRequest, etc.)
│   │   ├── lib/
│   │   │   └── utils.ts            # Helper: cn() do łączenia klas Tailwind
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                         # Micro-service proxy do OpenAI
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.ts             # Endpoint POST /api/chat
│   │   └── index.ts                # Express server + CORS + middleware
│   ├── package.json
│   └── tsconfig.json
├── example.ts                       # Oryginalna implementacja CLI (geneza projektu)
└── README.md
```

---

## 🌐 API Endpoint

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
DATABASE_URL=mysql://root:TWOJE_LOKALNE_HASLO@localhost:3306/fotai_dev
JWT_SECRET=change-me-in-local-env
FRONTEND_URL=http://localhost:3000
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

## ✨ Funkcjonalności MVP

- 💬 Czat z AI Photography Assistant w czasie rzeczywistym
- 🧠 Zachowanie historii rozmowy (`previous_response_id`) — model pamięta kontekst
- 💾 Persystencja czatu w `localStorage` (historia przeżyje odświeżenie strony)
- 📝 Renderowanie odpowiedzi AI jako Markdown (nagłówki, listy, bold, linki)
- ⏳ Loading state podczas oczekiwania na odpowiedź AI
- 🗑️ Czyszczenie historii czatu
- 📱 Responsywny design (mobile-first)
- 🌍 Routing: strona główna, /about, /how-it-works
- 🔐 Klucz API wyłącznie po stronie serwera — bezpieczna architektura proxy

---

## 📈 Fazy rozwoju

| Faza              | Cel                                               | Status       | Timeframe |
| ----------------- | ------------------------------------------------- | ------------ | --------- |
| **Phase 1 (MVP)** | Czat z AI + deploy na produkcję                   | ✅ Ukończona | Q1 2026   |
| **Phase 2**       | Konta użytkowników, historia chatów, wiele rozmów | 📅 Planowana | Q2 2026   |
| **Phase 3**       | Upload zdjęć + ocena przez AI (GPT-4 Vision)      | 📅 Planowana | Q3 2026   |
| **Phase 4**       | Edycja zdjęć przez AI (komendy tekstowe → DALL-E) | 📅 Planowana | Q4 2026+  |
| **Phase 5**       | Społeczność & portfolio fotograficzne             | 📅 Planowana | 2027+     |

---

## 🔄 Co będzie rozwijane następnie

### Phase 2: Konta użytkowników & Historia chatów (Q2 2026)

- Rejestracja i logowanie użytkowników
- Zapisywanie rozmów w bazie danych (MySQL na cyber_Folks + Prisma ORM)
- Możliwość tworzenia wielu chatów i przełączania się między nimi
- Historia rozmów dostępna po zalogowaniu
- Autentykacja: JWT, bcrypt
- **Infrastruktura**: Frontend (Vercel) + Backend (Railway) + Baza (MySQL na własnym hostingu)

### Phase 3: Upload & Ocena Zdjęć (Q3 2026)

- Użytkownik uploaduje zdjęcie → AI analizuje (kompozycja, ekspozycja, błędy)
- Integracja GPT-4 Vision API
- **Migracja bazy**: MySQL (cyber_Folks) → PostgreSQL (Supabase Free Tier)
- **Storage zdjęć**: Supabase Storage (zamiast S3/Cloudinary)
- Backend zostaje na Railway (unikamy timeoutów Vercel przy przetwarzaniu zdjęć)

### Phase 4: Edycja Zdjęć przez AI (Q4 2026+)

- Użytkownik podaje komendy tekstowe: „usuń drzewo", „dodaj chmury"
- AI wykonuje edycję zdjęcia (DALL-E 3 / inpainting)
- Widok before/after + eksport edytowanego zdjęcia

### Phase 5: Społeczność & Portfolio (2027+)

- Galeria publiczna zdjęć użytkowników
- Komentarze i oceny społeczności
- Portfolio fotograficzne dla każdego użytkownika

---

**Status**: ✅ Phase 1 MVP — aplikacja działa na produkcji  
**Live demo**: [https://fotai.app.vercel.app](https://fotai.app.vercel.app)  
**Ostatnia aktualizacja**: 23.02.2026
