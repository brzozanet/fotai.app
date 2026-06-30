# Sprint 2 Phase 2: Tryb gościa & Streaming — FOTAI

> 🎯 **Cel sprintu**: Odpowiedzi asystenta pojawiają się słowo po słowie zamiast naraz. Niezalogowany użytkownik może zadać jedno pytanie próbne bez rejestracji — po odpowiedzi asystenta pojawia się zaproszenie do logowania.

**Timeframe**: pół dnia (2–3h pracy efektywnej)  
**Poziom**: Junior — każdy nowy koncept wytłumaczony od zera

---

## 📋 Przegląd Sprintu

Do tej pory odpowiedź asystenta przychodziła w całości po kilku sekundach — użytkownik patrzył na spinner. W tym sprincie dodajemy **streaming SSE** do istniejącego endpointu `/api/chat`, dzięki czemu tekst pojawia się litera po literze już od pierwszego słowa.

Przy okazji otwieramy ten endpoint dla niezalogowanych użytkowników (**tryb gościa**) — każdy może wypróbować asystenta bez rejestracji. Po jednej odpowiedzi zamiast inputa pojawia się zachęta do założenia konta.

**Na koniec Sprint 2 Phase 2 powinieneś mieć**:

- ✅ Backend: `/api/chat` bez uwierzytelniania, odpowiada przez SSE (streaming)
- ✅ Frontend: typ `ChatState` rozszerzony o `isStreaming`, `streamingContent`, `sendGuestMessage`
- ✅ Frontend: `chatService.ts` — `askAI` obsługuje strumień SSE przez callbacki
- ✅ Frontend: `chatStore.ts` — nowe stany streamingu + akcja `sendGuestMessage`
- ✅ Frontend: `ChatInput.tsx` — tryb gościa z `GUEST_QUESTION_LIMIT`
- ✅ Frontend: `MessageList.tsx` — tekst „pisze się" podczas streamingu

**Dlaczego to ważne?**

Streaming to **największa poprawa UX** w tym projekcie — zamiast kilku sekund czekania na pustą stronę, użytkownik widzi odpowiedź od razu. Tryb gościa to wzorzec **freemium demo** — użytkownik ocenia wartość produktu zanim zdecyduje się na rejestrację.

---

## 🧱 Nowe technologie w tym sprincie

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

## 🎯 [ ] Task 2.1: Backend — streaming i tryb gościa (0.5h)

### Cel

Dwie zmiany w backendzie: (1) `/api/chat` przestaje wymagać tokenu — niezalogowani mogą go wywołać, (2) endpoint zaczyna strumieniować odpowiedź przez SSE zamiast zwracać ją naraz.

### Krok 1: Usuń `authMiddleware` z `/api/chat` w `backend/src/index.ts`

Otwórz `backend/src/index.ts` i zmień jeden wiersz:

```typescript
// BYŁO:
app.use("/api/chat", authMiddleware, chatRouter);

// JEST:
app.use("/api/chat", chatRouter); // ← endpoint publiczny, bez auth (tryb gościa)
```

> ⚠️ Endpoint nie zapisuje nic do bazy danych — wywołanie bez tokenu nie naraża na wyciek danych innych użytkowników.

---

### Krok 2: Dodaj SSE do `backend/src/routes/chat.ts`

Zastąp całą obsługę endpointu `chatRouter.post("/", ...)` wersją streamującą:

```typescript
chatRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { message, previousResponseId }: ChatRequest = request.body;

    if (!message || message.trim() === "") {
      return response
        .status(400)
        .json({ error: "Message is required" } as ErrorResponse);
    }

    // Otwórz strumień SSE — od tego momentu nie można już zmienić statusu HTTP
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();

    const stream = await client.responses.create({
      model: MODEL,
      stream: true,
      previous_response_id: previousResponseId,
      input: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: message.trim() },
      ],
    });

    let responseId = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        // Każdy kawałek tekstu → natychmiast do przeglądarki
        response.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      }
      if (event.type === "response.completed") {
        responseId = event.response.id;
      }
    }

    // Sygnał końca — frontend wie, że może zatrzymać odczyt
    response.write(`data: ${JSON.stringify({ done: true, responseId })}\n\n`);
    response.end();
  } catch (error) {
    console.error("[chat]", error);
    if (!response.headersSent) {
      // Nagłówki jeszcze nie wysłane — możemy zwrócić normalny błąd
      return response
        .status(500)
        .json({ error: "Server error" } as ErrorResponse);
    }
    // Nagłówki SSE już wysłane — błąd jako event
    response.write(`data: ${JSON.stringify({ error: "Błąd serwera." })}\n\n`);
    response.end();
  }
});
```

**Kluczowa różnica od poprzedniej wersji**: zamiast `await client.responses.create(...)` (czekamy na całość) używamy `stream: true` i iterujemy `for await`. Każde `event.delta` trafia do klienta natychmiast przez `response.write()`.

---

### Sprawdzenie

- [ ] `authMiddleware` usunięty z `/api/chat` w `index.ts`
- [ ] Endpoint `/api/chat` działa bez tokenu JWT
- [ ] Test streamingu bez autoryzacji:

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Co to jest złota godzina w fotografii?"}' \
  --no-buffer
# Oczekiwane: kolejne linie data: {"delta":"..."} bez nagłówka Authorization
```

- [ ] Test z zalogowanym userem (token nadal działa — endpoint go przyjmuje, ale nie wymaga):

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Czym różni się f/1.8 od f/2.8?"}' \
  --no-buffer
```

---

## 🎯 [ ] Task 2.2: Frontend typy (0.25h)

### Cel

Minimalna aktualizacja `frontend/src/types/chat.ts` — tylko to, czego potrzebuje Sprint 2. Typy dla wieloczatowości (`Chat`, `activeChatId`, lista chatów) przyjdą w Sprint 3.

### Zaktualizuj `frontend/src/types/chat.ts`

Do istniejącego interfejsu `ChatState` **dodaj** trzy pola. Nie usuwaj istniejących:

```typescript
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean; // ← NOWE: streaming SSE w toku
  streamingContent: string; // ← NOWE: treść aktualnie streamowanej odpowiedzi
  error: boolean;

  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  sendGuestMessage: (content: string) => Promise<void>; // ← NOWE: tryb gościa
}
```

**Dlaczego nie przepisujemy całego `ChatState`?**

Pełny refaktor typów (z `chats[]`, `activeChatId`, `fetchChats`, itp.) będzie potrzebny w Sprint 3, gdy piszemy Sidebar i wieloczatowość. W Sprint 2 wystarczą trzy nowe pola — reszta kodu (m.in. `ChatInput.tsx`, `MessageList.tsx`) nadal używa istniejących typów.

---

### Sprawdzenie

- [ ] `isStreaming`, `streamingContent`, `sendGuestMessage` dodane do `ChatState`
- [ ] Brak błędów TypeScript (`tsc --noEmit`)

---

## 🎯 [ ] Task 2.3: Frontend — chatService (0.5h)

### Cel

Aktualizacja funkcji `askAI` w `frontend/src/services/chatService.ts`, żeby czytała odpowiedź przez SSE (streaming) zamiast czekać na kompletny JSON.

### Zaktualizuj `frontend/src/services/chatService.ts`

Zastąp funkcję `askAI` wersją streamującą. Reszta pliku bez zmian:

```typescript
// Streaming — czyta SSE przez callbacki
export async function askAI(params: {
  message: string;
  previousResponseId?: string;
  onDelta: (delta: string) => void; // wywołany przy każdym kawałku tekstu
  onDone: (responseId: string) => void; // wywołany po zakończeniu streamingu
  onError: (error: string) => void; // wywołany przy błędzie serwera
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      previousResponseId: params.previousResponseId,
    }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Nieznany błąd" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // Czytamy strumień SSE
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) {
          params.onError(data.error);
          return;
        }
        if (data.delta) {
          params.onDelta(data.delta);
        }
        if (data.done) {
          params.onDone(data.responseId);
        }
      } catch {
        // ignoruj niepoprawne linie
      }
    }
  }
}
```

**Dlaczego nowa sygnatura zamiast starej?**

Stara `askAI(token, message, previousResponseId)` czekała na cały JSON. Nowa przyjmuje **callbacki** (`onDelta`, `onDone`, `onError`) — to jedyny sposób reagowania na dane, które przychodzą stopniowo przez strumień. Wzorzec Callback/Observer.

---

### Sprawdzenie

- [ ] `chatService.ts` — `askAI` przyjmuje obiekt z `onDelta`, `onDone`, `onError`
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 2.4: Frontend — chatStore (0.5h)

### Cel

Rozszerzenie istniejącego `chatStore.ts` o stany streamingu i akcję `sendGuestMessage`. **Nie przepisujemy całego store** — to zadanie Sprint 3.

### Zaktualizuj `frontend/src/store/chatStore.ts`

Dodaj nowe pola do stanu początkowego i nową akcję:

```typescript
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      isStreaming: false, // ← NOWE
      streamingContent: "", // ← NOWE
      error: false,

      // ... istniejące akcje (addMessage, clearMessages, setIsLoading, setError) bez zmian ...

      // ── Wiadomość gościa (bez logowania) ─────────────────────────────────
      sendGuestMessage: async (content: string) => {
        // Optymistyczne dodanie wiadomości usera
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
                    timestamp: new Date().toISOString(),
                  },
                ],
                isStreaming: false,
                streamingContent: "",
              }));
            },
            onError: (error) => {
              console.error("[chatStore] sendGuestMessage error:", error);
              set((state) => ({
                messages: state.messages.filter((m) => m.id !== tempId),
                isStreaming: false,
                streamingContent: "",
                error: true,
              }));
            },
          });
        } catch (error) {
          console.error("[chatStore] sendGuestMessage:", error);
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== tempId),
            isStreaming: false,
            streamingContent: "",
            error: true,
          }));
        }
      },
    }),
    { name: "fotai-chat-storage" },
  ),
);
```

> 📌 **Uwaga**: import `askAI` z `chatService` dodaj na górze pliku:
>
> ```typescript
> import { askAI } from "@/services/chatService";
> ```

---

### Sprawdzenie

- [ ] `isStreaming`, `streamingContent` w stanie początkowym (wartości: `false`, `""`)
- [ ] Akcja `sendGuestMessage` dodana
- [ ] Brak błędów TypeScript

## 🎯 [ ] Task 2.7: Frontend — ChatInput ze streamingiem (0.5h)

### Cel

Aktualizacja `ChatInput.tsx` aby korzystał z nowego `sendMessage` ze sklepu zamiast starego `askAI`.

### Zaktualizuj `frontend/src/components/chat/ChatInput.tsx`

**Zastąp całą zawartość pliku**:

```typescript
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { ThreeCircles } from "react-loader-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

// Próg darmowych odpowiedzi dla niezalogowanych użytkowników.
// Zmień na 2 aby zezwolić na dwie pełne wymiany bez rejestracji.
const GUEST_QUESTION_LIMIT = 1;

export function ChatInput() {
  const [input, setInput] = useState<string>("");

  const activeChatId = useChatStore((state) => state.activeChatId);
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const error = useChatStore((state) => state.error);
  const { sendMessage, sendGuestMessage, setError } = useChatStore();
  const { isAuthenticated } = useAuthStore();

  // Liczba pełnych odpowiedzi asystenta — wyznacza limit dla gościa.
  // Liczymy TYLKO wiadomości asystenta, bo wiadomość usera pojawia się
  // w tablicy PRZED odpowiedzią — nie triggerujemy prompta za wcześnie.
  const guestAnswersReceived = messages.filter((m) => m.role === "assistant").length;

  const isBusy = isLoading || isStreaming;

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isInputValid) return;

    setError(false);
    const content = input.trim();
    setInput("");

    if (isAuthenticated && activeChatId) {
      // Zalogowany użytkownik — streaming do konkretnego czatu w DB
      await sendMessage(content);
    } else if (!isAuthenticated && guestAnswersReceived < GUEST_QUESTION_LIMIT) {
      // Niezalogowany, limit nie osiągnięty — tryb gościa
      await sendGuestMessage(content);
    }
  };

  const isInputValid =
    input.trim().length >= 3 && input.trim().length <= 5000 && !isBusy;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && isInputValid) {
      handleSend(event as unknown as React.FormEvent);
    }
  };

  // ─── Gość po osiągnięciu limitu — wyświetl prompt logowania ─────────────
  if (!isAuthenticated && guestAnswersReceived >= GUEST_QUESTION_LIMIT) {
    return (
      <div className="rounded-xl border border-white/20 bg-black/50 p-5 text-center backdrop-blur-sm">
        <p className="mb-1 font-semibold text-white">
          Chcesz zadać kolejne pytanie?
        </p>
        <p className="mb-4 text-sm text-white/60">
          Zaloguj się lub zarejestruj bezpłatnie — historia rozmów będzie
          zapisana i dostępna z każdego urządzenia.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/login.html">
            <Button variant="outline" size="sm">
              Zaloguj się
            </Button>
          </Link>
          <Link to="/register.html">
            <Button size="sm">Zarejestruj się</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Zalogowany bez aktywnego czatu — nie renderuj inputa ────────────────
  if (isAuthenticated && !activeChatId) return null;

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

**Wyjaśnienie logiki warunkowej renderowania:**

```
isAuthenticated + activeChatId                          → normalny czat z DB + streaming
isAuthenticated + !activeChatId                         → null (sidebar pokaże listę chatów)
!isAuthenticated + guestAnswers < GUEST_QUESTION_LIMIT  → input widoczny, pytanie do /api/chat
!isAuthenticated + guestAnswers >= GUEST_QUESTION_LIMIT → prompt logowania (brak inputa)
```

Zmiana limitu z 1 na 2 to wyłącznie edycja stałej `GUEST_QUESTION_LIMIT` w tym pliku. Zero innych zmian w kodzie.

---

### Sprawdzenie

- [ ] `ChatInput.tsx` zaktualizowany — tryb gościa i zalogowanego obsługiwane oddzielnie
- [ ] Pierwsze pytanie niezalogowanego użytkownika jest wysyłane przez `sendGuestMessage`
- [ ] Po odpowiedzi asystenta pojawia się prompt logowania zamiast inputa
- [ ] Zalogowany użytkownik używa `sendMessage` (streaming do DB)
- [ ] `Enter` wysyła, `Shift+Enter` dodaje nową linię

---

## 🎯 [ ] Task 2.10: Tryb gościa — jedno pytanie bez logowania (0.5h)

### Cel

Zamiast natychmiastowego przekierowania na `/login.html` przy wejściu do czatu, niezalogowany użytkownik może zadać **jedno pytanie próbne**. Dopiero przy próbie zadania drugiego pytania pojawia się prośba o logowanie — jako część UI czatu, nie jako gwałtowny redirect.

### Dlaczego to ważne?

**Aktualny problem**: Focus na textarea natychmiast wywołuje redirect na `/login.html`. Użytkownik widzi formularz logowania, zanim zdążył ocenić wartość aplikacji.

**Cel**: Użytkownik najpierw doświadcza produktu (zadaje pytanie, dostaje odpowiedź), a dopiero potem, z własnej woli i z pełnym zrozumieniem wartości, decyduje się na rejestrację. To wzorzec **freemium demo** stosowany przez wiele produktów SaaS.

### Co już zostało zrobione w tym sprincie

Ta funkcjonalność jest wbudowana w zadania poprzednie. Dla przejrzystości — lista zmian powiązanych z trybem gościa:

| Zadanie  | Zmiana                                                       | Plik            |
| -------- | ------------------------------------------------------------ | --------------- |
| Task 2.2 | Usunięcie `authMiddleware` z `/api/chat`                     | `index.ts`      |
| Task 2.5 | Akcja `sendGuestMessage` wywołująca `askAI(null, ...)`       | `chatStore.ts`  |
| Task 2.7 | Stała `GUEST_QUESTION_LIMIT = 1` — próg darmowych odpowiedzi | `ChatInput.tsx` |
| Task 2.7 | Warunek oparty na `messages.filter(assistant).length`        | `ChatInput.tsx` |
| Task 2.7 | Prompt logowania gdy `guestAnswers >= GUEST_QUESTION_LIMIT`  | `ChatInput.tsx` |

### Schemat przepływu dla niezalogowanego użytkownika

```
Wejście na stronę (nie zalogowany)
        ↓
EmptyChat / ChatWindow z inputem (bez redirecta!)
        ↓
Użytkownik pisze pytanie → "Wyślij"
        ↓
guestAnswersReceived < GUEST_QUESTION_LIMIT → sendGuestMessage()
        ↓
POST /api/chat (bez tokenu, bez auth) → odpowiedź asystenta
        ↓
messages.filter(assistant).length === GUEST_QUESTION_LIMIT → prompt pojawia się
        ↓
Zamiast inputa pojawia się:
┌──────────────────────────────────────────┐
│  Chcesz zadać kolejne pytanie?           │
│  Zaloguj się lub zarejestruj bezpłatnie. │
│  [ Zaloguj się ]  [ Zarejestruj się ]    │
└──────────────────────────────────────────┘
        ↓
Użytkownik klika "Zarejestruj się" → /register.html → rejestracja
        ↓
Po zalogowaniu: pełny dostęp (sidebar, wiele chatów, streaming, historia)
```

### Uwagi implementacyjne

**Dlaczego liczymy odpowiedzi asystenta, a nie wiadomości usera?**

Po kliknięciu „Wyślij" wiadomość użytkownika trafia do tablicy `messages` natychmiast (Optimistic UI), zanim OpenAI zdąży odpowiedzieć. Gdybyśmy sprawdzali `messages.length > 0`, prompt logowania pojawiałby się podczas ładowania — zanim gość zobaczy odpowiedź. Filtrowanie po `role === 'assistant'` eliminuje ten problem: prompt pojawia się dopiero gdy asystent faktycznie odpowiedział.

**Jak zmienić limit?**

Wyłącznie stała `GUEST_QUESTION_LIMIT` w `ChatInput.tsx`. Zero innych zmian:

```typescript
const GUEST_QUESTION_LIMIT = 2; // zezwól na dwie wymiany zamiast jednej
```

**Czy limit przetrwa odświeżenie strony?**

Nie. `messages` nie jest persystowane (brak w `partialize`), więc po odświeżeniu tablica jest pusta — `guestAnswersReceived = 0`. Gość może zadać kolejne „pierwsze" pytanie. Jest to celowe — nie blokujemy, a jedynie delikatnie zachęcamy do rejestracji.

**Rate limiting** (ograniczenie liczby zapytań do `/api/chat` bez tokenu) to temat na przyszłość — jeśli endpoint będzie nadużywany, można dodać prostą ochronę po IP przez `express-rate-limit`.

---

### Sprawdzenie Task 2.10

- [ ] Niezalogowany użytkownik widzi input (brak natychmiastowego redirecta)
- [ ] Pierwsze pytanie niezalogowanego wysyłane do `/api/chat` (bez `Authorization`)
- [ ] Po odpowiedzi asystenta (`guestAnswers >= GUEST_QUESTION_LIMIT`) input zamienia się na prompt
- [ ] Prompt zawiera linki do `/login.html` i `/register.html`
- [ ] Po odświeżeniu strony `guestAnswersReceived` wraca do 0 — gość może zadać nowe pytanie
- [ ] Zmiana `GUEST_QUESTION_LIMIT = 2` → zezwala na dwie wymiany bez rejestracji
- [ ] Zalogowany użytkownik nie widzi promptu logowania — używa normalnego inputa

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

## ✅ Checklist Sprint 2 Phase 2 — Finał

### Backend

- [ ] `authMiddleware` usunięty z `/api/chat` w `index.ts`
- [ ] `backend/src/routes/chat.ts` — streaming SSE (`stream: true`, `flushHeaders`, `res.write`)

### Frontend

- [ ] `frontend/src/types/chat.ts` — `isStreaming`, `streamingContent`, `sendGuestMessage` w `ChatState`
- [ ] `frontend/src/services/chatService.ts` — `askAI` z callbackami `onDelta / onDone / onError`
- [ ] `frontend/src/store/chatStore.ts` — `sendGuestMessage`, `isStreaming`, `streamingContent`
- [ ] `frontend/src/components/chat/ChatInput.tsx` — `GUEST_QUESTION_LIMIT`, tryb gościa, prompt logowania
- [ ] `frontend/src/components/chat/MessageList.tsx` — streaming content, spinner

### Testy manualne

- [ ] **Streaming**: odpowiedź pojawia się słowo po słowie (nie naraz)
- [ ] **Spinner**: widoczny zanim pojawi się pierwsze słowo
- [ ] **Tryb gościa**: niezalogowany widzi input — brak natychmiastowego redirecta
- [ ] **Tryb gościa**: pierwsze pytanie dostaje odpowiedź (bez tokenu)
- [ ] **Tryb gościa**: po odpowiedzi pojawia się prompt „Zaloguj się / Zarejestruj się"
- [ ] **Tryb gościa**: po odświeżeniu gość może zadać nowe pytanie (brak blokady)
- [ ] Zalogowany użytkownik: czat działa jak dotychczas (input widoczny, odpowiedzi streamowane)

---

## 🚀 Co dalej? Sprint 3 Phase 2 — Wieloczatowość

W Sprint 3 skupiasz się na **wieloczatowości** — zapisywaniu rozmów w bazie danych i panelu bocznym z listą chatów:

- Backend: nowy plik `chats.ts` z endpointami CRUD (`GET/POST/PATCH/DELETE /api/chats`)
- Backend: endpoint SSE dla zalogowanych użytkowników (`POST /api/chats/:id/messages`)
- Frontend: pełna przebudowa `chatStore.ts` (multi-chat, `activeChatId`, `chats[]`)
- Frontend: pełna aktualizacja `chatService.ts` (CRUD + `streamMessage`)
- Frontend: nowy komponent `Sidebar` z listą chatów
- Frontend: aktualizacja `Layout.tsx` i `HomePage.tsx`
- Wiadomości zapisywane w MySQL — historia dostępna po zalogowaniu na innym urządzeniu
