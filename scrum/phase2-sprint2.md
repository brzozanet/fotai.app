# Sprint 2 Phase 2: Wieloczatowość & Streaming — FOTAI

> 🎯 **Cel sprintu**: Użytkownik może prowadzić wiele niezależnych rozmów, historia każdej rozmowy jest zapisywana w bazie MySQL, a odpowiedzi asystenta pojawiają się na ekranie słowo po słowie w czasie rzeczywistym.

**Timeframe**: 1–2 dni (6–8h pracy efektywnej)  
**Poziom**: Junior — każdy nowy koncept wytłumaczony od zera

---

## 📋 Przegląd Sprintu

Do tej pory cała historia czatu żyła w `localStorage` przeglądarki — razem z kodem, który ją obsługiwał. W tym sprincie **przenosimy wiadomości do bazy danych** i budujemy obsługę wielu niezależnych chatów.

Oprócz tego wprowadzamy **streaming** — odpowiedź asystenta nie będzie już czekać na kompletne wygenerowanie, tylko „pojawi się" na ekranie litera po literze, tak jak w oryginalnym ChatGPT.

**Na koniec Sprint 2 Phase 2 powinieneś mieć**:

- ✅ Backend: endpointy CRUD dla chatów (`GET/POST/PATCH/DELETE /api/chats`)
- ✅ Backend: endpoint pobierania wiadomości (`GET /api/chats/:id/messages`)
- ✅ Backend: endpoint wysyłania wiadomości ze streamingiem (`POST /api/chats/:id/messages`)
- ✅ Frontend: zaktualizowany `chatService.ts` z nowymi funkcjami
- ✅ Frontend: przebudowany `chatStore.ts` obsługujący wiele chatów
- ✅ Frontend: komponent `Sidebar` z listą chatów i przyciskiem „Nowy czat"
- ✅ Frontend: streaming odpowiedzi asystenta w `ChatInput`
- ✅ Frontend: zaktualizowany layout z Sidebartem

**Dlaczego to ważne?**

localStorage to "notes na telefonie" — tylko na Twoim urządzeniu, znika jak go wyczyścisz. Baza danych to "chmura" — możesz zalogować się z dowolnego miejsca i mieć całą historię. Streaming z kolei to colosalne polepszenie UX — użytkownik nie patrzy w pustą stronę przez kilka sekund.

---

## 🧱 Nowe technologie w tym sprincie

### REST API — CRUD chatów

**CRUD** = Create, Read, Update, Delete. To cztery podstawowe operacje na danych. W HTTP mapują się na metody:

| Operacja | HTTP   | Przykład                |
| -------- | ------ | ----------------------- |
| Create   | POST   | `POST /api/chats`       |
| Read     | GET    | `GET /api/chats`        |
| Update   | PATCH  | `PATCH /api/chats/:id`  |
| Delete   | DELETE | `DELETE /api/chats/:id` |

**Dlaczego PATCH, a nie PUT?**

`PUT` zastępuje cały zasób (musisz wysłać wszystkie pola). `PATCH` zmienia tylko wskazane pola — jeśli zmieniasz tylko tytuł czatu, wysyłasz tylko `{ "title": "Nowy tytuł" }`. PATCH to bardziej precyzyjna operacja.

---

### SSE — Server-Sent Events (streaming)

**Problem**: Standardowy HTTP działa w modelu pytanie–odpowiedź. Frontend pyta → backend odpowiada → koniec. Jak sprawić, żeby backend wysyłał dane **po kawałku**, w czasie gdy je generuje?

**Rozwiązanie**: Server-Sent Events (SSE) to technika, w której połączenie HTTP **nie jest zamykane** po wysłaniu pierwszego kawałka danych. Backend może pisać do strumienia wiele razy, a frontend czyta na bieżąco.

**Format SSE** — każdy kawałek to specjalnie sformatowany tekst:

```
data: {"delta": "Oto"}\n\n
data: {"delta": " pierwsze"}\n\n
data: {"delta": " słowo"}\n\n
data: {"done": true, "responseId": "resp_xyz"}\n\n
```

Linia musi zaczynać się od `data: ` i kończyć podwójnym `\n\n`. Backend wysyła kolejne linie, a frontend je odczytuje i aktualizuje UI po każdej.

**Analogia**: SSE to jak subskrypcja newslettera — raz się subskrybujesz (wysyłasz request), a potem dostajesz kolejne wiadomości bez ponownego pytania. HTTP bez streamingu to jak wysłanie maila i czekanie na jedną odpowiedź z całą treścią naraz.

---

### ReadableStream — czytanie strumienia na frontendzie

Gdy backend wysyła SSE, frontend musi go **czytać po kawałku**. Do tego służy `ReadableStream` — wbudowany w przeglądarkę interfejs do obsługi strumieni danych.

```typescript
const response = await fetch("/api/chats/:id/messages", { method: "POST", ... });

// response.body to ReadableStream
const reader = response.body!.getReader();
const decoder = new TextDecoder(); // konwertuje Uint8Array → string

while (true) {
  const { done, value } = await reader.read(); // czyta kawałek
  if (done) break;

  const text = decoder.decode(value, { stream: true }); // dekoduje bajty
  // parsuj linie SSE z tekstu...
}
```

`getReader()` zwraca czytnik. Każde `read()` zwraca `{ done, value }`:

- `value` = surowe bajty (`Uint8Array`) — dekodujemy przez `TextDecoder`
- `done = true` — strumień skończony, wychodzimy z pętli

---

### `partialize` w Zustand persist

Dotychczas `chatStore` zapisywał w `localStorage` całą tablicę wiadomości. W Sprint 2 wiadomości żyją w bazie — nie chcemy ich duplikować w localStorage.

`partialize` pozwala wybrać **tylko wybrane pola**, które mają być persystowane:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: "fotai-chat-storage",
    partialize: (state) => ({ activeChatId: state.activeChatId }),
    // ^ zapamiętaj tylko activeChatId, reszta (messages, chats) ładuje się z DB
  }
)
```

---

## 🎯 [ ] Task 2.1: Typy TypeScript (0.25h)

### Cel

Zaktualizowanie typów po stronie backendu i frontendu, żeby odzwierciedlały nową strukturę danych: wiele chatów, wiadomości z bazy, streaming.

---

### Backend: `backend/src/types/chat.ts`

**Zastąp istniejącą zawartość** nowym kodem:

```typescript
// Typy dla istniejącego endpointu POST /api/chat (backward compatibility)
export interface ChatRequest {
  message: string;
  previousResponseId?: string;
}

export interface ChatResponse {
  id: string;
  message: string;
  timestamp: string;
}

// Typy dla nowych endpointów chatów
export interface CreateChatResponse {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
}

export interface MessageFromDB {
  id: string;
  role: string;
  content: string;
  openaiId: string | null;
  chatId: string;
  createdAt: string;
}

// Typy dla żądań
export interface SendMessageRequest {
  message: string;
  previousResponseId?: string;
}

export interface RenameChatRequest {
  title: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
```

---

### Frontend: `frontend/src/types/chat.ts`

**Zastąp istniejącą zawartość** nowym kodem:

```typescript
// Wiadomość — format używany w UI
export interface Message {
  id: string; // ID z bazy danych
  role: "user" | "assistant";
  content: string;
  openaiId?: string; // ID z OpenAI (previousResponseId) — tylko dla asystenta
  timestamp: string;
}

// Chat — dane z bazy danych
export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
}

// Stan sklepu Zustand
export interface ChatState {
  chats: Chat[]; // lista wszystkich chatów usera
  activeChatId: string | null; // ID aktualnie otwartego czatu
  messages: Message[]; // wiadomości aktywnego czatu
  isLoading: boolean; // oczekiwanie na odpowiedź
  isStreaming: boolean; // streaming w toku
  streamingContent: string; // treść aktualnie streamowanej odpowiedzi
  error: boolean;

  // akcje na chatach
  fetchChats: () => Promise<void>;
  createChat: () => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  setActiveChat: (id: string) => Promise<void>;

  // akcje na wiadomościach
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;

  // pomocnicze
  clearMessages: () => void;
  setError: (error: boolean) => void;
}

// Stare typy — zostawiam dla backward compatibility z obecnym /api/chat
export interface ChatRequest {
  message: string;
  previousResponseId?: string;
}

export interface ChatResponse {
  id: string;
  message: string;
  timestamp: string;
}
```

**Dlaczego zostają stare typy?**

Istniejący endpoint `POST /api/chat` nadal działa (możemy go usunąć dopiero gdy cały UI jest podpięty pod nowe endpointy). Przez okres przejściowy oba działają równolegle.

---

### Sprawdzenie

- [ ] `backend/src/types/chat.ts` zaktualizowany
- [ ] `frontend/src/types/chat.ts` zaktualizowany z nowymi interfejsami

---

## 🎯 [ ] Task 2.2: Backend — CRUD chatów (1h)

### Cel

Stworzenie nowego pliku z endpointami do zarządzania chatami: lista, tworzenie, zmiana nazwy, usuwanie.

### Utwórz plik `backend/src/routes/chats.ts`

> ⚠️ **Uwaga**: Tworzymy nowy plik `chats.ts` (liczba mnoga), żeby **nie modyfikować** istniejącego `chat.ts`. Stary endpoint `/api/chat` nadal obsługuje obecne UI — nowe endpointy `/api/chats` będą używane po przebudowie frontendu.

```typescript
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { RenameChatRequest } from "../types/chat.js";

export const chatsRouter = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/chats — lista chatów zalogowanego użytkownika
// ─────────────────────────────────────────────────────────────
chatsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" }, // najnowsze na górze
    });

    return res.json(chats);
  } catch (error) {
    console.error("[chats/GET]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/chats — utwórz nowy czat
// ─────────────────────────────────────────────────────────────
chatsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chat.create({
      data: {
        userId: req.user!.userId,
        title: "Nowy czat",
      },
    });

    return res.status(201).json(chat);
  } catch (error) {
    console.error("[chats/POST]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/chats/:id — zmień tytuł czatu
// ─────────────────────────────────────────────────────────────
chatsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { title }: RenameChatRequest = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Tytuł nie może być pusty." });
    }

    // Sprawdź czy czat należy do zalogowanego usera
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Czat nie istnieje." });
    }

    const updated = await prisma.chat.update({
      where: { id: req.params.id },
      data: { title: title.trim() },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[chats/PATCH]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/chats/:id — usuń czat (i wszystkie jego wiadomości przez CASCADE)
// ─────────────────────────────────────────────────────────────
chatsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Sprawdź czy czat należy do zalogowanego usera
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Czat nie istnieje." });
    }

    // onDelete: Cascade w schema.prisma automatycznie usuwa Message[]
    await prisma.chat.delete({ where: { id: req.params.id } });

    return res.status(204).send(); // 204 No Content — sukces, brak ciała odpowiedzi
  } catch (error) {
    console.error("[chats/DELETE]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});
```

**Wyjaśnienie `req.user!.userId`:**

Wykrzyknik `!` (non-null assertion) mówi TypeScriptowi: "wiem, że `req.user` tutaj istnieje, zaufaj mi". To jest bezpieczne, bo `authMiddleware` gwarantuje istnienie `req.user` — bez ważnego tokenu request nigdy nie dotrze do handlera.

**Dlaczego sprawdzamy `findFirst({ where: { id, userId } })`?**

To kluczowe zabezpieczenie: użytkownik A nie może usunąć czatu użytkownika B, nawet jeśli zna jego ID. Bez tego sprawdzenia atakujący mógłby podać dowolne ID i usunąć cudze dane. To wzorzec **Authorization check** — sprawdzamy nie tylko _czy_ zasób istnieje, ale _czy należy do aktualnego usera_.

---

### Podpięcie routera w `backend/src/index.ts`

Otwórz `backend/src/index.ts` i dodaj nowy import oraz mount:

```typescript
import { chatRouter } from "./routes/chat.js";
import { authRouter } from "./routes/auth.js";
import { chatsRouter } from "./routes/chats.js"; // ← dodaj
import { authMiddleware } from "./middleware/auth.js";

// ... (istniejący kod)

app.use("/api/auth", authRouter);
app.use("/api/chat", authMiddleware, chatRouter); // stary endpoint — zostaje
app.use("/api/chats", authMiddleware, chatsRouter); // ← nowe endpointy chatów
```

---

### Sprawdzenie

- [ ] Plik `backend/src/routes/chats.ts` utworzony
- [ ] `chatsRouter` podpięty w `backend/src/index.ts` pod `/api/chats`
- [ ] Test ręczny — stworzenie czatu (curl lub Postman):

```bash
# Pobierz token logując się:
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "tajne1234"}'

# Utwórz czat (wklej TOKEN z odpowiedzi logowania):
curl -X POST http://localhost:3001/api/chats \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
# Oczekiwane: { "id": "clob...", "title": "Nowy czat", "userId": "...", "createdAt": "..." }

# Lista chatów:
curl http://localhost:3001/api/chats \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎯 [ ] Task 2.3: Backend — wiadomości i streaming (1h)

### Cel

Dodanie do `chats.ts` dwóch endpointów: GET dla historii wiadomości i POST dla wysyłania wiadomości z streamingiem SSE.

### Czym jest streaming w OpenAI SDK?

Normalnie `client.responses.create()` czeka aż OpenAI wygeneruje **całą** odpowiedź i zwraca ją naraz. Przy długich odpowiedziach to nawet kilkanaście sekund czekania na pustą stronę.

`client.responses.create({ stream: true })` zwraca obiekt `AsyncIterable` — możesz iterować przez niego pętlą `for await`, dostając kolejne fragmenty odpowiedzi na bieżąco.

```typescript
// BEZ streamingu — czeka kilka sekund, potem naraz zwraca całość
const response = await client.responses.create({ model: "...", ... });
console.log(response.output_text); // "Oto długa odpowiedź o fotografii..."

// ZE streamingiem — każda iteracja = kawałek tekstu
const stream = await client.responses.create({ model: "...", stream: true, ... });
for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta); // "Oto" " długa" " odpowiedź"...
  }
}
```

---

### Dodaj do pliku `backend/src/routes/chats.ts`

Dopisz poniższy kod na końcu pliku (przed ostatnim `export`):

```typescript
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL!;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT!;
const CURRENT_WORKSHOPS = process.env.CURRENT_WORKSHOPS!;
const CURRENT_WORKSHOPS_RULES = process.env.CURRENT_WORKSHOPS_RULES!;

// Buduje system prompt z połączenia kilku zmiennych env (tak jak w chat.ts)
const buildSystemPrompt = () =>
  [
    SYSTEM_PROMPT.trim(),
    "<CurrentWorkshops>",
    CURRENT_WORKSHOPS.trim(),
    "</CurrentWorkshops>",
    CURRENT_WORKSHOPS_RULES.trim(),
  ].join("\n");

// ─────────────────────────────────────────────────────────────
// GET /api/chats/:id/messages — historia wiadomości czatu
// ─────────────────────────────────────────────────────────────
chatsRouter.get("/:id/messages", async (req: Request, res: Response) => {
  try {
    // Sprawdź czy czat należy do zalogowanego usera
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Czat nie istnieje." });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      orderBy: { createdAt: "asc" }, // od najstarszej do najnowszej
    });

    return res.json(messages);
  } catch (error) {
    console.error("[chats/:id/messages GET]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/chats/:id/messages — wyślij wiadomość (streaming SSE)
// ─────────────────────────────────────────────────────────────
chatsRouter.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const { message, previousResponseId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Wiadomość nie może być pusta." });
    }

    // 1. Sprawdź czy czat należy do zalogowanego usera
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Czat nie istnieje." });
    }

    // 2. Zapisz wiadomość użytkownika do bazy
    const userMessage = await prisma.message.create({
      data: {
        chatId: req.params.id,
        role: "user",
        content: message.trim(),
      },
    });

    // 3. Ustaw nagłówki SSE — to "otwiera" strumień
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-User-Message-Id", userMessage.id); // ID wiadomości usera dla frontendu
    res.flushHeaders(); // Wyślij nagłówki natychmiast, zanim OpenAI zacznie odpowiadać

    // 4. Streaming przez OpenAI Responses API
    const stream = await client.responses.create({
      model: MODEL,
      stream: true,
      previous_response_id: previousResponseId || undefined,
      input: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: message.trim() },
      ],
    });

    let fullContent = ""; // zbieramy pełną odpowiedź do zapisu w DB
    let responseId = ""; // ID odpowiedzi z OpenAI (= previousResponseId dla następnej wiadomości)

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        fullContent += event.delta;
        // Wysyłamy każdy kawałek do frontendu w formacie SSE
        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      }

      if (event.type === "response.completed") {
        responseId = event.response.id;
      }
    }

    // 5. Zapisz pełną odpowiedź asystenta do bazy
    const assistantMessage = await prisma.message.create({
      data: {
        chatId: req.params.id,
        role: "assistant",
        content: fullContent,
        openaiId: responseId,
      },
    });

    // 6. Wyślij zdarzenie zakończenia — frontend wie, że może zakończyć odczyt
    res.write(
      `data: ${JSON.stringify({
        done: true,
        responseId,
        assistantMessageId: assistantMessage.id,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error("[chats/:id/messages POST]", error);
    // Przy streamingu nie możemy już zmienić statusu (headers zostały wysłane),
    // więc wysyłamy błąd jako SSE event
    res.write(`data: ${JSON.stringify({ error: "Błąd serwera." })}\n\n`);
    res.end();
  }
});
```

> ⚠️ **Ważne**: `res.flushHeaders()` powoduje natychmiastowe wysłanie nagłówków HTTP do klienta. Bez tego Express buforuje odpowiedź i frontend czekałby na pierwsze bajty. Po `flushHeaders()` nie możesz już ustawić nowych nagłówków ani zmienić kodu statusu — wszystko idzie jako strumień danych.

---

### Sprawdzenie

- [ ] Endpointy `GET /:id/messages` i `POST /:id/messages` dodane do `chats.ts`
- [ ] Import `OpenAI` i `dotenv` dodany na początku pliku
- [ ] Test GET historii wiadomości:

```bash
# Wstaw ID czatu z poprzedniego kroku
curl http://localhost:3001/api/chats/CHAT_ID/messages \
  -H "Authorization: Bearer TOKEN"
# Oczekiwane: [] (pusta tablica — czat jest nowy)
```

- [ ] Test streamingu (curl pokazuje dane przyrastające w konsoli):

```bash
curl -X POST http://localhost:3001/api/chats/CHAT_ID/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Co to jest złota godzina w fotografii?"}' \
  --no-buffer
# Oczekiwane: linie data: {"delta":"..."} pojawiające się stopniowo
```

---

## 🎯 [ ] Task 2.4: Frontend — chatService (0.5h)

### Cel

Rozszerzenie `frontend/src/services/chatService.ts` o nowe funkcje do zarządzania chatami i wysyłania wiadomości ze streamingiem.

### Zaktualizuj `frontend/src/services/chatService.ts`

**Zastąp całą zawartość pliku**:

```typescript
import { useAuthStore } from "@/store/authStore";
import type { Chat, ChatRequest, ChatResponse, Message } from "@/types/chat";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Pomocnicze ───────────────────────────────────────────────────────────────

// Obsługuje odpowiedzi 401 — wylogowuje i przekierowuje na stronę logowania
function handleUnauthorized(): never {
  useAuthStore.getState().setAuthLogout();
  window.location.href = "/login.html";
  throw new Error("UNAUTHORIZED");
}

// Generyczna funkcja do JSON requestów (GET/POST/PATCH/DELETE)
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { token } = useAuthStore.getState();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) handleUnauthorized();

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Nieznany błąd" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // 204 No Content (DELETE) nie ma ciała
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ── Zarządzanie chatami ──────────────────────────────────────────────────────

export async function getChats(): Promise<Chat[]> {
  return apiRequest<Chat[]>("/api/chats");
}

export async function createChat(): Promise<Chat> {
  return apiRequest<Chat>("/api/chats", { method: "POST" });
}

export async function renameChat(id: string, title: string): Promise<Chat> {
  return apiRequest<Chat>(`/api/chats/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteChat(id: string): Promise<void> {
  return apiRequest<void>(`/api/chats/${id}`, { method: "DELETE" });
}

// ── Wiadomości ───────────────────────────────────────────────────────────────

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const raw = await apiRequest<
    Array<{
      id: string;
      role: string;
      content: string;
      openaiId: string | null;
      chatId: string;
      createdAt: string;
    }>
  >(`/api/chats/${chatId}/messages`);

  // Mapujemy dane z bazy na format używany przez UI
  return raw.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    openaiId: m.openaiId ?? undefined,
    timestamp: m.createdAt,
  }));
}

// Streaming — wysyła wiadomość i zwraca dane przez callbacki
export async function streamMessage(params: {
  chatId: string;
  message: string;
  previousResponseId?: string;
  onDelta: (delta: string) => void; // wywołany przy każdym kawałku tekstu
  onDone: (responseId: string, assistantMessageId: string) => void; // wywołany po zakończeniu
  onError: (error: string) => void; // wywołany przy błędzie
}): Promise<void> {
  const { token } = useAuthStore.getState();

  const response = await fetch(
    `${API_URL}/api/chats/${params.chatId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: params.message,
        previousResponseId: params.previousResponseId,
      }),
    },
  );

  if (response.status === 401) handleUnauthorized();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Czytamy strumień SSE
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Dekodujemy bajty na tekst
    const text = decoder.decode(value, { stream: true });

    // Każda linia SSE zaczyna się od "data: "
    const lines = text.split("\n").filter((line) => line.startsWith("data: "));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6)); // odcinamy "data: "

        if (data.error) {
          params.onError(data.error);
          return;
        }

        if (data.delta) {
          params.onDelta(data.delta);
        }

        if (data.done) {
          params.onDone(data.responseId, data.assistantMessageId);
        }
      } catch {
        // Ignoruj nieprawidłowo sformatowane linie
      }
    }
  }
}

// ── Backward compatibility — stary endpoint /api/chat ───────────────────────

export async function askAI(
  token: string | null,
  message: string,
  previousResponseId?: string,
): Promise<ChatResponse> {
  const requestBody: ChatRequest = {
    message,
    ...(previousResponseId && { previousResponseId }),
  };

  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().setAuthLogout();
      window.location.href = "/login.html";
      throw new Error("UNAUTHORIZED");
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: "Nieznany błąd" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
```

**Wyjaśnienie wzorca `onDelta / onDone / onError`:**

Funkcja `streamMessage` jest asynchroniczna i trwa przez cały czas streamingu. Żeby poinformować store o każdym kawałku tekstu, przekazujemy **callbacki** — funkcje, które zostaną wywołane w odpowiednim momencie. To wzorzec **Callback / Observer**.

```typescript
// Wywołanie w chatStore:
await streamMessage({
  chatId,
  message,
  onDelta: (delta) => {
    // Ta funkcja wywoła się ~50-100 razy podczas streamingu
    set((state) => ({ streamingContent: state.streamingContent + delta }));
  },
  onDone: (responseId, assistantMessageId) => {
    // Ta wywoła się raz, gdy OpenAI skończy generować
    set({ isStreaming: false });
  },
  onError: (error) => {
    set({ error: true, isStreaming: false });
  },
});
```

---

### Sprawdzenie

- [ ] `frontend/src/services/chatService.ts` zaktualizowany
- [ ] Eksportuje: `getChats`, `createChat`, `renameChat`, `deleteChat`, `getChatMessages`, `streamMessage`, `askAI` (backward compat)
- [ ] Brak błędów TypeScript w pliku

---

## 🎯 [ ] Task 2.5: Frontend — chatStore (przebudowa) (1h)

### Cel

Całkowita przebudowa `frontend/src/store/chatStore.ts`. Nowy store obsługuje wiele chatów, ładuje wiadomości z backendu i zarządza stanem streamingu.

### Zastąp `frontend/src/store/chatStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/chat";
import * as chatService from "@/services/chatService";
import { useAuthStore } from "./authStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingContent: "",
      error: false,

      // ── Czaty ──────────────────────────────────────────────────────────────

      fetchChats: async () => {
        try {
          const chats = await chatService.getChats();
          set({ chats });
        } catch (error) {
          console.error("[chatStore] fetchChats:", error);
        }
      },

      createChat: async () => {
        try {
          const chat = await chatService.createChat();
          // Dodaj nowy czat na początek listy i aktywuj go
          set((state) => ({
            chats: [chat, ...state.chats],
            activeChatId: chat.id,
            messages: [], // nowy czat = puste wiadomości
          }));
        } catch (error) {
          console.error("[chatStore] createChat:", error);
          set({ error: true });
        }
      },

      deleteChat: async (id: string) => {
        try {
          await chatService.deleteChat(id);
          set((state) => {
            const filteredChats = state.chats.filter((c) => c.id !== id);
            // Jeśli usuwamy aktywny czat, aktywuj pierwszy dostępny lub null
            const newActiveChatId =
              state.activeChatId === id
                ? (filteredChats[0]?.id ?? null)
                : state.activeChatId;

            return {
              chats: filteredChats,
              activeChatId: newActiveChatId,
              // Jeśli usunęliśmy aktywny czat — wyczyść wiadomości
              messages: state.activeChatId === id ? [] : state.messages,
            };
          });

          // Załaduj wiadomości nowego aktywnego czatu
          const { activeChatId } = get();
          if (activeChatId) {
            await get().loadMessages(activeChatId);
          }
        } catch (error) {
          console.error("[chatStore] deleteChat:", error);
          set({ error: true });
        }
      },

      renameChat: async (id: string, title: string) => {
        try {
          const updated = await chatService.renameChat(id, title);
          set((state) => ({
            chats: state.chats.map((c) => (c.id === id ? updated : c)),
          }));
        } catch (error) {
          console.error("[chatStore] renameChat:", error);
          set({ error: true });
        }
      },

      setActiveChat: async (id: string) => {
        set({ activeChatId: id, messages: [], error: false });
        await get().loadMessages(id);
      },

      // ── Wiadomości ─────────────────────────────────────────────────────────

      loadMessages: async (chatId: string) => {
        try {
          set({ isLoading: true });
          const messages = await chatService.getChatMessages(chatId);
          set({ messages, isLoading: false });
        } catch (error) {
          console.error("[chatStore] loadMessages:", error);
          set({ isLoading: false, error: true });
        }
      },

      sendMessage: async (content: string) => {
        const { activeChatId, messages } = get();

        if (!activeChatId) {
          console.error("[chatStore] Brak aktywnego czatu");
          return;
        }

        // Optymistyczne dodanie wiadomości usera do UI (nie czekamy na backend)
        const tempUserMessage = {
          id: `temp-${Date.now()}`,
          role: "user" as const,
          content,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, tempUserMessage],
          isStreaming: true,
          streamingContent: "",
          error: false,
        }));

        // Znajdź previousResponseId — openaiId ostatniej wiadomości asystenta
        const lastAssistantMsg = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");
        const previousResponseId = lastAssistantMsg?.openaiId;

        try {
          await chatService.streamMessage({
            chatId: activeChatId,
            message: content,
            previousResponseId,

            onDelta: (delta) => {
              // Doklejamy każdy kawałek do streamingContent
              set((state) => ({
                streamingContent: state.streamingContent + delta,
              }));
            },

            onDone: (responseId, assistantMessageId) => {
              const { streamingContent } = get();

              // Zastępujemy tymczasową wiadomość usera prawdziwą z DB
              // i dodajemy finalną wiadomość asystenta
              set((state) => ({
                messages: [
                  // Usuń temp wiadomość usera
                  ...state.messages.filter((m) => !m.id.startsWith("temp-")),
                  // Dodaj wiadomość asystenta z pełną treścią
                  {
                    id: assistantMessageId,
                    role: "assistant" as const,
                    content: streamingContent,
                    openaiId: responseId,
                    timestamp: new Date().toISOString(),
                  },
                ],
                isStreaming: false,
                streamingContent: "",
              }));
            },

            onError: (error) => {
              console.error("[chatStore] streaming error:", error);
              set((state) => ({
                // Usuń tymczasową wiadomość usera przy błędzie
                messages: state.messages.filter(
                  (m) => !m.id.startsWith("temp-"),
                ),
                isStreaming: false,
                streamingContent: "",
                error: true,
              }));
            },
          });
        } catch (error) {
          console.error("[chatStore] sendMessage:", error);
          set((state) => ({
            messages: state.messages.filter((m) => !m.id.startsWith("temp-")),
            isStreaming: false,
            streamingContent: "",
            error: error instanceof Error && error.message !== "UNAUTHORIZED",
          }));
        }
      },

      // ── Pomocnicze ────────────────────────────────────────────────────────

      clearMessages: () => set({ messages: [], error: false }),
      setError: (error) => set({ error }),
    }),
    {
      name: "fotai-chat-storage",
      // Persystujemy TYLKO activeChatId — reszta ładuje się z DB
      partialize: (state) => ({ activeChatId: state.activeChatId }),
    },
  ),
);
```

**Wyjaśnienie „optymistycznego UI":**

```typescript
// Najpierw pokazujemy wiadomość w UI (natychmiast)
set((state) => ({ messages: [...state.messages, tempUserMessage] }));

// Potem wysyłamy do backendu (asynchronicznie)
await chatService.streamMessage({ ... });
```

Gdybyśmy czekali na potwierdzenie z backendu, UI „zamrożyłoby się" po kliknięciu „Wyślij". Zamiast tego natychmiast pokazujemy wiadomość (z tymczasowym ID `temp-...`), a gdy backend potwierdzi zapis, podmieniamy ją na prawdziwą. Taki wzorzec nazywa się **Optimistic UI** i jest standardem w nowoczesnych aplikacjach.

---

### Aktualizacja `frontend/src/store/authStore.ts`

Wylogowanie powinno czyścić stan czatów. Zaktualizuj `authStore.ts`:

```typescript
import type { AuthState } from "@/types/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuthLogin: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Wczytaj chaty po zalogowaniu (lazy import żeby uniknąć circular dependency)
        import("./chatStore").then(({ useChatStore }) => {
          useChatStore.getState().fetchChats();
        });
      },

      setAuthLogout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Wyczyść stan czatów
        import("./chatStore").then(({ useChatStore }) => {
          useChatStore.setState({
            chats: [],
            activeChatId: null,
            messages: [],
            isStreaming: false,
            streamingContent: "",
            error: false,
          });
        });
      },
    }),
    { name: "fotai-auth-storage" },
  ),
);
```

> 📌 **Dlaczego `import()` zamiast `useChatStore.getState()`?** Bezpośredni import `chatStore` w `authStore` i odwrotnie tworzyłby **circular dependency** (pętlę zależności), co może powodować błędy inicjalizacji modułów. `import()` (dynamic import) ładuje moduł leniwie, już po inicjalizacji obu storów.

---

### Sprawdzenie

- [ ] `frontend/src/store/chatStore.ts` zastąpiony nową wersją
- [ ] `frontend/src/store/authStore.ts` zaktualizowany (lazy import chatStore)
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 2.6: Frontend — Sidebar (1h)

### Cel

Stworzenie komponentu `Sidebar` wyświetlającego listę chatów użytkownika z opcjami tworzenia, usuwania i zmiany nazwy.

### Utwórz `frontend/src/components/layout/Sidebar.tsx`

```typescript
import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";

export function Sidebar() {
  const {
    chats,
    activeChatId,
    isStreaming,
    fetchChats,
    createChat,
    deleteChat,
    renameChat,
    setActiveChat,
  } = useChatStore();

  // ID czatu, którego tytuł aktualnie edytujemy
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Załaduj listę chatów przy pierwszym renderze
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleCreateChat = async () => {
    await createChat();
  };

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleConfirmRename = async (id: string) => {
    if (editTitle.trim().length > 0) {
      await renameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleConfirmRename(id);
    if (e.key === "Escape") handleCancelEdit();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm">
      {/* Przycisk Nowy czat */}
      <div className="p-3">
        <Button
          onClick={handleCreateChat}
          disabled={isStreaming}
          className="w-full gap-2"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          Nowy czat
        </Button>
      </div>

      {/* Lista chatów */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {chats.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-white/40">
            Brak chatów. Kliknij „Nowy czat".
          </p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => !editingId && setActiveChat(chat.id)}
            className={`
              group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm
              transition-colors hover:bg-white/10
              ${activeChatId === chat.id ? "bg-white/15 text-white" : "text-white/70"}
            `}
          >
            {/* Tytuł lub pole edycji */}
            {editingId === chat.id ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, chat.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="h-6 flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
              />
            ) : (
              <span className="flex-1 truncate">{chat.title}</span>
            )}

            {/* Przyciski akcji */}
            {editingId === chat.id ? (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleConfirmRename(chat.id)}
                  className="text-green-400 hover:text-green-300"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-400 hover:text-red-300"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden gap-1 group-hover:flex">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(chat.id, chat.title);
                  }}
                  className="text-white/40 hover:text-white"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="text-white/40 hover:text-red-400"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

**Wyjaśnienie `e.stopPropagation()`:**

Kiedy klikasz ikonkę Edytuj wewnątrz `<div>` czatu, zdarzenie kliknięcia "puchnie" w górę drzewa DOM (event bubbling) i dociera do kontenera — który zaczyna ładować wiadomości czatu.

`stopPropagation()` zatrzymuje to "puchnięcie" — zdarzenie nie trafi do rodzica. Dzięki temu kliknięcie przycisku edycji nie przełączy aktywnego czatu.

---

### Sprawdzenie

- [ ] `frontend/src/components/layout/Sidebar.tsx` utworzony
- [ ] Widoczna lista chatów, przycisk „Nowy czat", ikony edycji/usuwania
- [ ] Kliknięcie czatu ładuje jego wiadomości

---

## 🎯 [ ] Task 2.7: Frontend — ChatInput ze streamingiem (0.5h)

### Cel

Aktualizacja `ChatInput.tsx` aby korzystał z nowego `sendMessage` ze sklepu zamiast starego `askAI`.

### Zaktualizuj `frontend/src/components/chat/ChatInput.tsx`

**Zastąp całą zawartość pliku**:

```typescript
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useChatStore } from "@/store/chatStore";
import { ThreeCircles } from "react-loader-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

export function ChatInput() {
  const [input, setInput] = useState<string>("");

  const activeChatId = useChatStore((state) => state.activeChatId);
  const isLoading = useChatStore((state) => state.isLoading);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const error = useChatStore((state) => state.error);
  const { sendMessage, setError } = useChatStore();

  const isBusy = isLoading || isStreaming;

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isInputValid || !activeChatId) return;

    setError(false);
    const content = input.trim();
    setInput("");

    await sendMessage(content);
  };

  const isInputValid =
    input.trim().length >= 3 && input.trim().length <= 5000 && !isBusy;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && isInputValid) {
      handleSend(event as unknown as React.FormEvent);
    }
  };

  // Brak aktywnego czatu — nie renderuj inputa
  if (!activeChatId) return null;

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>
            Nie udało się wysłać wiadomości. Spróbuj ponownie.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Zadaj pytanie o fotografię... (Enter = wyślij, Shift+Enter = nowa linia)"
          disabled={isBusy}
          rows={2}
          className="flex-1 resize-none"
        />

        <Button type="submit" disabled={!isInputValid} className="shrink-0">
          {isBusy ? (
            <ThreeCircles height={20} width={20} color="white" />
          ) : (
            "Wyślij"
          )}
        </Button>
      </form>
    </div>
  );
}
```

---

### Sprawdzenie

- [ ] `ChatInput.tsx` zaktualizowany — używa `sendMessage` ze store
- [ ] Przycisk zablokowany gdy `isStreaming`
- [ ] `Enter` wysyła, `Shift+Enter` dodaje nową linię

---

## 🎯 [ ] Task 2.8: Frontend — MessageList ze streamingiem (0.5h)

### Cel

Aktualizacja `MessageList.tsx`, żeby pokazywał streamowaną odpowiedź w trakcie generowania.

### Zaktualizuj `frontend/src/components/chat/MessageList.tsx`

Otwórz plik i sprawdź jego aktualną zawartość. Dodaj obsługę `streamingContent`:

```typescript
import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { Message } from "./Message";
import { ThreeCircles } from "react-loader-spinner";

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const streamingContent = useChatStore((state) => state.streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {/* Streamowana odpowiedź — pokazuje się w trakcie generowania */}
      {isStreaming && (
        <div className="flex flex-col gap-1">
          {streamingContent ? (
            // Tekst pojawia się stopniowo
            <Message
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingContent,
                timestamp: new Date().toISOString(),
              }}
            />
          ) : (
            // Spinner zanim pojawią się pierwsze słowa
            <div className="flex items-center gap-2 text-sm text-white/50">
              <ThreeCircles height={20} width={20} color="white" />
              <span>Asystent pisze...</span>
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
```

---

### Sprawdzenie

- [ ] `MessageList.tsx` zaktualizowany
- [ ] Widoczny spinner zanim pojawią się pierwsze słowa
- [ ] Tekst „dorasta" podczas streamingu
- [ ] Auto-scroll działa podczas streamingu

---

## 🎯 [ ] Task 2.9: Frontend — Layout z Sidebarrem (0.25h)

### Cel

Aktualizacja `Layout.tsx` i `HomePage.tsx` aby Sidebar był widoczny gdy użytkownik jest zalogowany.

### Zaktualizuj `frontend/src/components/layout/Layout.tsx`

```typescript
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/store/authStore";
import backgroundAbstract from "../../assets/background/neonblur.jpg";

export function Layout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div
      className="relative isolate flex h-screen flex-col"
      style={{
        backgroundColor: "#000",
        backgroundImage: `url(${backgroundAbstract})`,
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <Header />
      <div className="material-enter-soft relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar widoczny tylko dla zalogowanych */}
        {isAuthenticated && <Sidebar />}

        {/* Główna treść strony */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

### Zaktualizuj `frontend/src/pages/HomePage.tsx`

```typescript
import { useEffect } from "react";
import { ChatWindow } from "@/components/layout/ChatWindow";
import { EmptyChat } from "@/components/layout/EmptyChat";
import { useChatStore } from "@/store/chatStore";

export function HomePage() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chats = useChatStore((state) => state.chats);
  const messages = useChatStore((state) => state.messages);
  const { loadMessages } = useChatStore();

  // Przy wejściu na stronę — załaduj wiadomości aktywnego czatu
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId, loadMessages]);

  // Mamy aktywny czat z wiadomościami lub streaming w toku
  const hasChatContent = activeChatId && messages.length > 0;

  return (
    <div className="flex h-full w-full flex-col items-center gap-6 text-center">
      {hasChatContent ? <ChatWindow /> : <EmptyChat />}
    </div>
  );
}
```

---

### Sprawdzenie

- [ ] `Layout.tsx` zaktualizowany — Sidebar widoczny po zalogowaniu
- [ ] `HomePage.tsx` zaktualizowany — ładuje wiadomości aktywnego czatu
- [ ] Brak błędów TypeScript

---

## ✅ Checklist Sprint 2 Phase 2 — Finał

### Backend

- [ ] `backend/src/routes/chats.ts` — nowy plik z endpointami CRUD i streamingiem
- [ ] `GET /api/chats` — zwraca listę chatów usera
- [ ] `POST /api/chats` — tworzy nowy czat
- [ ] `PATCH /api/chats/:id` — zmienia tytuł czatu
- [ ] `DELETE /api/chats/:id` — usuwa czat (Cascade usuwa wiadomości)
- [ ] `GET /api/chats/:id/messages` — zwraca historię wiadomości
- [ ] `POST /api/chats/:id/messages` — wysyła wiadomość ze streamingiem SSE
- [ ] `chatsRouter` podpięty w `index.ts` pod `/api/chats` z `authMiddleware`

### Frontend

- [ ] `frontend/src/types/chat.ts` — nowe typy `Chat`, zaktualizowany `ChatState`
- [ ] `frontend/src/services/chatService.ts` — funkcje CRUD i `streamMessage`
- [ ] `frontend/src/store/chatStore.ts` — multi-chat, streaming, `partialize`
- [ ] `frontend/src/store/authStore.ts` — lazy import chatStore przy logout
- [ ] `frontend/src/components/layout/Sidebar.tsx` — lista chatów, nowy czat, edycja, usuwanie
- [ ] `frontend/src/components/chat/ChatInput.tsx` — używa `sendMessage` ze store
- [ ] `frontend/src/components/chat/MessageList.tsx` — streaming content
- [ ] `frontend/src/components/layout/Layout.tsx` — Sidebar w layoucie
- [ ] `frontend/src/pages/HomePage.tsx` — ładuje wiadomości aktywnego czatu

### Testy manualne

- [ ] Utwórz nowy czat — pojawia się w Sidebarze
- [ ] Wyślij wiadomość — odpowiedź pojawia się litera po literze
- [ ] Odśwież stronę — aktywny czat i jego historia są wczytywane z DB
- [ ] Zaloguj na innym urządzeniu/przeglądarce — widzisz tę samą historię
- [ ] Zmień nazwę czatu — aktualizuje się w Sidebarze
- [ ] Usuń czat — znika z Sidebara, aktywuje się następny
- [ ] Prisma Studio: tabele `Chat` i `Message` zawierają dane
- [ ] Brak duplikatów wiadomości w DB

---

## 🚀 Co dalej? Sprint 3 Phase 2

W Sprint 3 skupiasz się na **zarządzaniu kontem użytkownika i przygotowaniu do deploy**:

- Strona ustawień konta (`/account.html`) — zmiana emaila i hasła
- Usuwanie konta (z potwierdzeniem przez `alert-dialog`)
- Endpointy: `PATCH /api/auth/account`, `DELETE /api/auth/account`
- Przygotowanie do usług premium (infrastruktura płatności — TBD)
- Migracja Prisma na produkcyjną bazę MySQL na cyber_Folks
- Deploy: Railway (backend) + Vercel (frontend)
