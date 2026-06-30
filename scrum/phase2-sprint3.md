# Sprint 3 Phase 2: Wieloczatowość — FOTAI

> 🎯 **Cel sprintu**: Każda rozmowa jest zapisywana w MySQL. Zalogowany użytkownik może tworzyć wiele niezależnych chatów, przełączać się między nimi i zarządzać nimi z panelu bocznego. Odpowiedzi zalogowanych użytkowników są streamowane przez dedykowany endpoint.

**Timeframe**: 1–2 dni (4–6h pracy efektywnej)  
**Poziom**: Junior — budujemy na fundamencie z Sprint 2

---

## 📋 Przegląd Sprintu

W Sprint 2 dodaliśmy streaming i tryb gościa — aplikacja jest żywsza. Teraz robimy krok w stronę **prawdziwej persystencji**: rozmowy trafiają do bazy MySQL, a nie do pamięci przeglądarki. Zalogowany użytkownik dostaje panel boczny (Sidebar) z listą wszystkich swoich chatów.

To jest największy sprint Phase 2 pod względem zmian w architekturze — przepisujemy `chatStore`, rozbudowujemy `chatService` i tworzymy nowy komponent UI.

**Na koniec Sprint 3 Phase 2 powinieneś mieć**:

- ✅ Backend: CRUD dla chatów (`GET/POST/PATCH/DELETE /api/chats`)
- ✅ Backend: pobieranie wiadomości (`GET /api/chats/:id/messages`)
- ✅ Backend: wysyłanie wiadomości ze streamingiem SSE (`POST /api/chats/:id/messages`)
- ✅ Frontend: pełna aktualizacja typów (`Chat`, pełny `ChatState`)
- ✅ Frontend: rozbudowany `chatService.ts` (CRUD + `streamMessage`)
- ✅ Frontend: pełna przebudowa `chatStore.ts` (multi-chat, `activeChatId`)
- ✅ Frontend: komponent `Sidebar` z listą chatów
- ✅ Frontend: `Layout.tsx` i `HomePage.tsx` z Sidebarrem
- ✅ Wiadomości zapisywane w MySQL, historia cross-device

**Dlaczego to ważne?**

localStorage to "notatnik na jednym komputerze" — znika po wyczyszczeniu, nie działa na telefonie. MySQL to "chmura" — dane zawsze dostępne, na każdym urządzeniu, dla każdej liczby chatów.

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

`PUT` zastępuje cały zasób — musisz wysłać wszystkie pola naraz. `PATCH` zmienia tylko wskazane pola — jeśli zmieniasz tylko tytuł, wysyłasz `{ "title": "Nowy tytuł" }`. PATCH to bardziej precyzyjna operacja.

---

### Authorization check — bezpieczeństwo endpointów

Każdy endpoint dla chatów weryfikuje nie tylko _czy zasób istnieje_, ale _czy należy do aktualnego usera_:

```typescript
const chat = await prisma.chat.findFirst({
  where: { id: req.params.id, userId: req.user!.userId }, // ← oba warunki!
});
if (!chat) return res.status(404).json({ error: "Czat nie istnieje." });
```

Bez tego użytkownik A mógłby wywołać `DELETE /api/chats/ID_CZATU_B` i usunąć dane innego użytkownika. Wzorzec **Authorization check** (nie mylić z Authentication) sprawdza uprawnienia do konkretnego zasobu.

---

### `partialize` w Zustand persist

W Sprint 3 wiadomości żyją w bazie — nie chcemy ich duplikować w `localStorage`. `partialize` pozwala wybrać **tylko wybrane pola** do persystencji:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: "fotai-chat-storage",
    partialize: (state) => ({ activeChatId: state.activeChatId }),
    // ^ zapamiętaj tylko activeChatId — reszta ładuje się z DB po odświeżeniu
  }
)
```

---

## 🎯 [ ] Task 3.1: Frontend typy — pełna aktualizacja (0.25h)

### Cel

Pełna aktualizacja `frontend/src/types/chat.ts` — dodanie typu `Chat` i przepisanie `ChatState` pod wieloczatowość. Stare typy z Sprint 2 (`isStreaming`, `streamingContent`, `sendGuestMessage`) zostają.

### Zastąp `frontend/src/types/chat.ts`

```typescript
// Wiadomość — format używany w UI
export interface Message {
  id: string;
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
  isStreaming: boolean; // streaming SSE w toku
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
  sendGuestMessage: (content: string) => Promise<void>; // z Sprint 2, zostaje

  // pomocnicze
  clearMessages: () => void;
  setError: (error: boolean) => void;
}

// Backward compatibility z /api/chat (Sprint 2)
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

---

### Sprawdzenie

- [ ] Typ `Chat` dodany
- [ ] `ChatState` zawiera `chats`, `activeChatId`, pełne akcje na chatach
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 3.2: Backend — CRUD chatów (1h)

### Cel

Stworzenie nowego pliku `backend/src/routes/chats.ts` z endpointami do zarządzania chatami.

### Dodaj typy do `backend/src/types/chat.ts`

Dodaj na końcu pliku (istniejące typy zostają):

```typescript
// Typy dla nowych endpointów chatów
export interface RenameChatRequest {
  title: string;
}

export interface MessageFromDB {
  id: string;
  role: string;
  content: string;
  openaiId: string | null;
  chatId: string;
  createdAt: string;
}
```

---

### Utwórz `backend/src/routes/chats.ts`

> ℹ️ Tworzymy **nowy** plik `chats.ts` (liczba mnoga). Istniejący `chat.ts` (ze streamingiem gościa) zostaje bez zmian.

```typescript
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { RenameChatRequest } from "../types/chat.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const chatsRouter = Router();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL!;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT!;
const CURRENT_WORKSHOPS = process.env.CURRENT_WORKSHOPS!;
const CURRENT_WORKSHOPS_RULES = process.env.CURRENT_WORKSHOPS_RULES!;

const buildSystemPrompt = () =>
  [
    SYSTEM_PROMPT.trim(),
    "<CurrentWorkshops>",
    CURRENT_WORKSHOPS.trim(),
    "</CurrentWorkshops>",
    CURRENT_WORKSHOPS_RULES.trim(),
  ].join("\n");

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
      data: { userId: req.user!.userId, title: "Nowy czat" },
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

    // Authorization check — czat musi należeć do usera
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!chat) return res.status(404).json({ error: "Czat nie istnieje." });

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
// DELETE /api/chats/:id — usuń czat (CASCADE usuwa wiadomości)
// ─────────────────────────────────────────────────────────────
chatsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!chat) return res.status(404).json({ error: "Czat nie istnieje." });

    await prisma.chat.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    console.error("[chats/DELETE]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/chats/:id/messages — historia wiadomości czatu
// ─────────────────────────────────────────────────────────────
chatsRouter.get("/:id/messages", async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!chat) return res.status(404).json({ error: "Czat nie istnieje." });

    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    return res.json(messages);
  } catch (error) {
    console.error("[chats/:id/messages GET]", error);
    return res.status(500).json({ error: "Błąd serwera." });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/chats/:id/messages — wyślij wiadomość (SSE streaming + zapis do DB)
// ─────────────────────────────────────────────────────────────
chatsRouter.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const { message, previousResponseId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Wiadomość nie może być pusta." });
    }

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!chat) return res.status(404).json({ error: "Czat nie istnieje." });

    // Zapisz wiadomość usera do bazy
    const userMessage = await prisma.message.create({
      data: { chatId: req.params.id, role: "user", content: message.trim() },
    });

    // Otwórz strumień SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-User-Message-Id", userMessage.id);
    res.flushHeaders();

    const stream = await client.responses.create({
      model: MODEL,
      stream: true,
      previous_response_id: previousResponseId || undefined,
      input: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: message.trim() },
      ],
    });

    let fullContent = "";
    let responseId = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        fullContent += event.delta;
        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      }
      if (event.type === "response.completed") {
        responseId = event.response.id;
      }
    }

    // Zapisz odpowiedź asystenta do bazy
    const assistantMessage = await prisma.message.create({
      data: {
        chatId: req.params.id,
        role: "assistant",
        content: fullContent,
        openaiId: responseId,
      },
    });

    res.write(
      `data: ${JSON.stringify({ done: true, responseId, assistantMessageId: assistantMessage.id })}\n\n`,
    );
    res.end();
  } catch (error) {
    console.error("[chats/:id/messages POST]", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Błąd serwera." });
    }
    res.write(`data: ${JSON.stringify({ error: "Błąd serwera." })}\n\n`);
    res.end();
  }
});
```

### Podpięcie w `backend/src/index.ts`

Dodaj import i mount:

```typescript
import { chatsRouter } from "./routes/chats.js"; // ← dodaj

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter); // publiczny (Sprint 2)
app.use("/api/chats", authMiddleware, chatsRouter); // ← dodaj
```

---

### Sprawdzenie

- [ ] `backend/src/routes/chats.ts` utworzony
- [ ] `chatsRouter` podpięty w `index.ts`
- [ ] Test CRUD:

```bash
# Token z logowania
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"fotaitest"}' | jq -r '.token')

# Utwórz czat
curl -X POST http://localhost:3001/api/chats -H "Authorization: Bearer $TOKEN"

# Lista chatów
curl http://localhost:3001/api/chats -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 [ ] Task 3.3: Frontend — chatService (0.5h)

### Cel

Rozszerzenie `frontend/src/services/chatService.ts` o funkcje CRUD dla chatów i `streamMessage` dla zalogowanych użytkowników.

### Dodaj do `frontend/src/services/chatService.ts`

Na końcu pliku (istniejące funkcje zostają):

```typescript
import type { Chat, Message } from "@/types/chat";
import { useAuthStore } from "@/store/authStore";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Pomocnicza — obsługuje 401
function handleUnauthorized(): never {
  useAuthStore.getState().setAuthLogout();
  window.location.href = "/login.html";
  throw new Error("UNAUTHORIZED");
}

// Pomocnicza — generyczne żądania z tokenem
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
    const err = await response.json().catch(() => ({ error: "Nieznany błąd" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// ── CRUD chatów ──────────────────────────────────────────────────────────────

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
      createdAt: string;
    }>
  >(`/api/chats/${chatId}/messages`);

  return raw.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    openaiId: m.openaiId ?? undefined,
    timestamp: m.createdAt,
  }));
}

// Streaming SSE dla zalogowanych użytkowników
export async function streamMessage(params: {
  chatId: string;
  message: string;
  previousResponseId?: string;
  onDelta: (delta: string) => void;
  onDone: (responseId: string, assistantMessageId: string) => void;
  onError: (error: string) => void;
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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder
      .decode(value, { stream: true })
      .split("\n")
      .filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) {
          params.onError(data.error);
          return;
        }
        if (data.delta) params.onDelta(data.delta);
        if (data.done) params.onDone(data.responseId, data.assistantMessageId);
      } catch {
        /* ignoruj */
      }
    }
  }
}
```

---

### Sprawdzenie

- [ ] `getChats`, `createChat`, `renameChat`, `deleteChat`, `getChatMessages`, `streamMessage` eksportowane
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 3.4: Frontend — chatStore (przebudowa) (1h)

### Cel

Pełna przebudowa `frontend/src/store/chatStore.ts`. Nowy store obsługuje wiele chatów, ładuje wiadomości z backendu i obsługuje streaming dla zalogowanych użytkowników. Akcja `sendGuestMessage` z Sprint 2 zostaje.

### Zastąp `frontend/src/store/chatStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/chat";
import * as chatService from "@/services/chatService";
import { askAI } from "@/services/chatService";

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
          set((state) => ({
            chats: [chat, ...state.chats],
            activeChatId: chat.id,
            messages: [],
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
            const filtered = state.chats.filter((c) => c.id !== id);
            const newActiveId =
              state.activeChatId === id
                ? (filtered[0]?.id ?? null)
                : state.activeChatId;
            return {
              chats: filtered,
              activeChatId: newActiveId,
              messages: state.activeChatId === id ? [] : state.messages,
            };
          });
          const { activeChatId } = get();
          if (activeChatId) await get().loadMessages(activeChatId);
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
        if (!activeChatId) return;

        const tempId = `temp-${Date.now()}`;
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: tempId,
              role: "user" as const,
              content,
              timestamp: new Date().toISOString(),
            },
          ],
          isStreaming: true,
          streamingContent: "",
          error: false,
        }));

        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        try {
          await chatService.streamMessage({
            chatId: activeChatId,
            message: content,
            previousResponseId: lastAssistant?.openaiId,

            onDelta: (delta) => {
              set((state) => ({
                streamingContent: state.streamingContent + delta,
              }));
            },

            onDone: (responseId, assistantMessageId) => {
              const { streamingContent } = get();
              set((state) => ({
                messages: [
                  ...state.messages.filter((m) => m.id !== tempId),
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
                messages: state.messages.filter((m) => m.id !== tempId),
                isStreaming: false,
                streamingContent: "",
                error: true,
              }));
            },
          });
        } catch (error) {
          console.error("[chatStore] sendMessage:", error);
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== tempId),
            isStreaming: false,
            streamingContent: "",
            error: error instanceof Error && error.message !== "UNAUTHORIZED",
          }));
        }
      },

      // ── Tryb gościa (z Sprint 2) ───────────────────────────────────────────

      sendGuestMessage: async (content: string) => {
        const tempId = `guest-${Date.now()}`;
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: tempId,
              role: "user" as const,
              content,
              timestamp: new Date().toISOString(),
            },
          ],
          isStreaming: true,
          streamingContent: "",
          error: false,
        }));

        try {
          await askAI({
            message: content,
            onDelta: (delta) => {
              set((state) => ({
                streamingContent: state.streamingContent + delta,
              }));
            },
            onDone: (responseId) => {
              const { streamingContent } = get();
              set((state) => ({
                messages: [
                  ...state.messages.filter((m) => m.id !== tempId),
                  {
                    id: responseId,
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
              set((state) => ({
                messages: state.messages.filter((m) => m.id !== tempId),
                isStreaming: false,
                streamingContent: "",
                error: true,
              }));
            },
          });
        } catch {
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== tempId),
            isStreaming: false,
            streamingContent: "",
            error: true,
          }));
        }
      },

      // ── Pomocnicze ────────────────────────────────────────────────────────

      clearMessages: () => set({ messages: [], error: false }),
      setError: (error) => set({ error }),
    }),
    {
      name: "fotai-chat-storage",
      // Persystujemy TYLKO activeChatId — wiadomości ładują się z DB
      partialize: (state) => ({ activeChatId: state.activeChatId }),
    },
  ),
);
```

### Zaktualizuj `frontend/src/store/authStore.ts`

Wylogowanie powinno czyścić stan chatStore:

```typescript
setAuthLogout: () => {
  set({ user: null, token: null, isAuthenticated: false });
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
```

> 📌 `import()` (dynamic import) zamiast bezpośredniego importu — zapobiega **circular dependency** między `authStore` i `chatStore`.

---

### Sprawdzenie

- [ ] `chatStore.ts` zastąpiony nową wersją
- [ ] `authStore.ts` — `setAuthLogout` czyści stan chatStore
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 3.5: Frontend — Sidebar (1h)

### Cel

Nowy komponent `Sidebar` wyświetlający listę chatów z opcjami tworzenia, usuwania i zmiany nazwy.

### Utwórz `frontend/src/components/layout/Sidebar.tsx`

```typescript
import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";

export function Sidebar() {
  const { chats, activeChatId, isStreaming, fetchChats, createChat, deleteChat, renameChat, setActiveChat } =
    useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const handleConfirmRename = async (id: string) => {
    if (editTitle.trim().length > 0) await renameChat(id, editTitle.trim());
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleConfirmRename(id);
    if (e.key === "Escape") { setEditingId(null); setEditTitle(""); }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="p-3">
        <Button onClick={() => createChat()} disabled={isStreaming} className="w-full gap-2" variant="outline">
          <PlusIcon className="h-4 w-4" /> Nowy czat
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {chats.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-white/40">Brak chatów. Kliknij „Nowy czat".</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => !editingId && setActiveChat(chat.id)}
            className={`group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
              activeChatId === chat.id ? "bg-white/15 text-white" : "text-white/70"
            }`}
          >
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

            {editingId === chat.id ? (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleConfirmRename(chat.id)} className="text-green-400 hover:text-green-300">
                  <CheckIcon className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setEditingId(null); setEditTitle(""); }} className="text-red-400 hover:text-red-300">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden gap-1 group-hover:flex">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                  className="text-white/40 hover:text-white"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
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

**Dlaczego `e.stopPropagation()`?** Kliknięcie przycisku edycji „puchnie" (event bubbling) do rodzica `<div>`, który wywołuje `setActiveChat`. `stopPropagation()` zatrzymuje to puchnięcie.

---

### Sprawdzenie

- [ ] `Sidebar.tsx` utworzony
- [ ] Lista chatów widoczna, „Nowy czat" działa
- [ ] Edycja nazwy: Enter zatwierdza, Escape anuluje
- [ ] Usuwanie czatu aktywuje następny z listy

---

## 🎯 [ ] Task 3.6: Frontend — ChatInput dla zalogowanych (0.5h)

### Cel

Aktualizacja `ChatInput.tsx` — dla zalogowanych użytkowników używa nowego `sendMessage` (streaming do DB przez `/api/chats/:id/messages`). Tryb gościa z Sprint 2 zostaje.

### Zaktualizuj `frontend/src/components/chat/ChatInput.tsx`

Zmień tylko część odpowiedzialną za `handleSend` — do istniejącego kodu z Sprint 2 wystarczy jedna zmiana: dodać obsługę `activeChatId` dla zalogowanych:

```typescript
const handleSend = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!isInputValid) return;

  setError(false);
  const content = input.trim();
  setInput("");

  if (isAuthenticated && activeChatId) {
    // Zalogowany + aktywny czat → streaming do bazy danych
    await sendMessage(content);
  } else if (!isAuthenticated && guestAnswersReceived < GUEST_QUESTION_LIMIT) {
    // Gość — tryb z Sprint 2
    await sendGuestMessage(content);
  }
};

// Dodaj do destrukturyzacji store:
const { sendMessage, sendGuestMessage, setError } = useChatStore();
const activeChatId = useChatStore((state) => state.activeChatId);
```

Jeśli `ChatInput.tsx` był już zaktualizowany w Sprint 2 z logiką gościa, zmiana jest minimalna — tylko upewnij się, że `sendMessage` jest importowane ze store.

---

### Sprawdzenie

- [ ] Zalogowany użytkownik z aktywnym czatem: wiadomości idą do `sendMessage` (DB)
- [ ] Niezalogowany: tryb gościa działa jak w Sprint 2
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 3.7: Frontend — Layout i HomePage (0.25h)

### Cel

Aktualizacja `Layout.tsx` i `HomePage.tsx` — Sidebar widoczny dla zalogowanych, strona główna ładuje historię aktywnego czatu.

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
        {isAuthenticated && <Sidebar />}
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
  const messages = useChatStore((state) => state.messages);
  const { loadMessages } = useChatStore();

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId);
  }, [activeChatId, loadMessages]);

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

- [ ] `Layout.tsx` — Sidebar widoczny tylko dla zalogowanych
- [ ] `HomePage.tsx` — ładuje wiadomości aktywnego czatu przy wejściu
- [ ] Brak błędów TypeScript

---

## ✅ Checklist Sprint 3 Phase 2 — Finał

### Backend

- [ ] `backend/src/routes/chats.ts` — CRUD + streaming SSE dla zalogowanych
- [ ] `GET /api/chats` — zwraca listę chatów usera
- [ ] `POST /api/chats` — tworzy nowy czat
- [ ] `PATCH /api/chats/:id` — zmienia tytuł (authorization check)
- [ ] `DELETE /api/chats/:id` — usuwa czat + CASCADE na wiadomościach
- [ ] `GET /api/chats/:id/messages` — zwraca historię
- [ ] `POST /api/chats/:id/messages` — streaming SSE + zapis do DB
- [ ] `chatsRouter` podpięty w `index.ts` z `authMiddleware`

### Frontend

- [ ] `frontend/src/types/chat.ts` — typ `Chat`, pełny `ChatState`
- [ ] `frontend/src/services/chatService.ts` — CRUD + `streamMessage`
- [ ] `frontend/src/store/chatStore.ts` — multi-chat + streaming + `sendGuestMessage`
- [ ] `frontend/src/store/authStore.ts` — `setAuthLogout` czyści chatStore
- [ ] `frontend/src/components/layout/Sidebar.tsx` — lista, nowy czat, edycja, usuwanie
- [ ] `frontend/src/components/chat/ChatInput.tsx` — `sendMessage` dla zalogowanych
- [ ] `frontend/src/components/layout/Layout.tsx` — Sidebar w layoucie
- [ ] `frontend/src/pages/HomePage.tsx` — ładuje aktywny czat

### Testy manualne

- [ ] Utwórz nowy czat — pojawia się w Sidebarze
- [ ] Wyślij wiadomość (zalogowany) — odpowiedź streamowana, zapisana w DB
- [ ] Odśwież stronę — aktywny czat i historia wczytane z DB
- [ ] Zaloguj na innym urządzeniu — widzisz tę samą historię
- [ ] Zmień nazwę czatu — aktualizuje się w Sidebarze
- [ ] Usuń czat — znika z Sidebara, aktywuje się następny
- [ ] Prisma Studio: tabele `Chat` i `Message` zawierają dane
- [ ] Niezalogowany: tryb gościa z Sprint 2 nadal działa

---

## 🚀 Co dalej? Sprint 4 Phase 2 — Konto użytkownika

W Sprint 4 skupiasz się na **zarządzaniu kontem i przygotowaniu do deploy**:

- Strona ustawień konta (`/account.html`) — zmiana emaila i hasła
- Usuwanie konta (z potwierdzeniem przez `alert-dialog`)
- Endpointy: `PATCH /api/auth/account`, `DELETE /api/auth/account`
- Przygotowanie do usług premium (infrastruktura płatności — TBD)
- Migracja Prisma na produkcyjną bazę MySQL na cyber_Folks
- Deploy: Railway (backend) + Vercel (frontend)
