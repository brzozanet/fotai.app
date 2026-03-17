# Sprint 3: Integracja & Deploy - FOTAI

> 🎯 **Część Phase 1 MVP**: Połączenie Frontend + Backend i wdrożenie na produkcję

**Timeframe**: 1 dzień (4-5h pracy efektywnej)  
**Cel końcowy**: Działająca aplikacja online dostępna dla użytkowników (Vercel + Render)

---

## 📋 Przegląd Sprintu

W Sprint 3 **łączymy wszystko w całość** i **wdrażamy na produkcję**. Po Sprint 1 (Frontend) i Sprint 2 (Backend) mamy gotowe komponenty - teraz je integrujemy i publikujemy online.

**Na koniec Sprint 3 powinieneś mieć**:

- ✅ Frontend komunikuje się z backendem (rzeczywiste odpowiedzi AI, nie mockowane).
- ✅ Historia rozmowy zapisuje się w localStorage (przetrwa refresh)
- ✅ Loading states, error handling, przyciski Clear Chat
- ✅ Backend wdrożony na Render (dostępny online)
- ✅ Frontend wdrożony na Vercel (dostępny online)
- ✅ Environment variables skonfigurowane dla produkcji
- ✅ End-to-end testy przeprowadzone (aplikacja działa bez błędów)
- ✅ Favicon, meta tags, README z linkami do live demo

**Dlaczego to ważne?**

- 🚀 **MVP Online**: Twoja aplikacja będzie **publicznie dostępna** (link w portfolio!)
- 📸 **Rzeczywisty AI**: Użytkownicy dostaną prawdziwe porady fotograficzne
- 💼 **Portfolio**: Gotowy projekt do pokazania pracodawcom/klientom
- 🎓 **Deployment Experience**: Nauczysz się wdrażać full-stack aplikacje

**Projekt portfolio**: Ten sprint pokazuje umiejętności: full-stack integration, deployment, DevOps basics, production readiness

---

## 🎯 Architektura po Sprint 3

```
┌─────────────────────────────────────────────────────────────┐
│  USER'S BROWSER                                             │
│  https://fotai.app.vercel.app                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Request
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                          │
│  React + Vite + TailwindCSS + Shadcn/ui                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Zustand Store + localStorage                          │  │
│  │ (Historia aktywnego czatu przetrwa refresh)           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ chatService.ts                                        │  │
│  │ - sendMessage(message, previousResponseId)            │  │
│  │ - Wysyła POST /api/chat                               │  │
│  └─────────────────┬─────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ POST https://promptly-backend.onrender.com/api/chat
                     │ Body: { message: "...", previousResponseId: "..." }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Render)                                           │
│  Express.js + TypeScript                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/chat Endpoint                                    │  │
│  │ - Odczytuje message z body                            │  │
│  │ - Dodaje system prompt (Photography Expert)           │  │
│  │ - Wysyła do OpenAI API                                │  │
│  └─────────────────┬─────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ OpenAI API Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  OPENAI API                                                 │
│  model: gpt-4o-mini / gpt-4o                                │
│  System Prompt: "Jesteś ekspertem w fotografii..."          │
│  previous_response_id: "chatcmpl-..."                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Response
                 ▼
                USER sees: "Do fotografii nocnej bez tripodu..."
```

**Flow Szczegółowy**:

1. Użytkownik wpisuje: "Jak robić zdjęcia nocne?"
2. Frontend (`ChatWindow.tsx`) wywołuje `handleSendMessage()`
3. `chatService.ts` wysyła POST do backendu na Render
4. Backend (`routes/chat.ts`) odbiera request, dodaje system prompt, wysyła do OpenAI
5. OpenAI zwraca odpowiedź + `response.id`
6. Backend przekazuje odpowiedź do frontendu
7. Frontend wyświetla wiadomość + zapisuje do Zustand + localStorage
8. Historia przetrwa refresh przeglądarki

---

## 🎯 Task 3.1: Podłączenie Frontend → Backend (0.5h)

### Cel

Zaimplementowanie rzeczywistej komunikacji z backendem w `chatService.ts` (zamiast mockowanych danych).

### **Czym jest chatService?**

To moduł frontendu, który:

- Wysyła HTTP requesty do backendu
- Obsługuje błędy sieci
- Formatuje dane przed wysłaniem i po odebraniu

**Analogia**: To jak "listonosz" - zabiera wiadomość od użytkownika (frontend) i niesie ją do "poczty" (backend).

---

### Plik: `frontend/src/services/chatService.ts`

**Zastąp całą zawartość** pliku tym kodem:

```typescript
import { ChatRequest, ChatResponse } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Wysyła wiadomość do backend API
 * @param message - Wiadomość użytkownika
 * @param previousResponseId - ID poprzedniej odpowiedzi (dla kontynuacji rozmowy)
 * @returns Odpowiedź AI z ID i timestampem
 */
export async function sendMessage(
  message: string,
  previousResponseId?: string,
): Promise<ChatResponse> {
  try {
    // Przygotuj payload
    const requestBody: ChatRequest = {
      message,
      ...(previousResponseId && { previousResponseId }), // Dodaj tylko jeśli istnieje
    };

    console.log("[chatService] Wysyłam request:", requestBody);

    // Wyślij POST request do backendu
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Sprawdź czy response jest OK (status 200-299)
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    // Parsuj JSON response
    const data: ChatResponse = await response.json();
    console.log("[chatService] Otrzymano odpowiedź:", data);

    return data;
  } catch (error) {
    console.error("[chatService] Błąd:", error);

    // Sprawdź typ błędu i rzuć user-friendly message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Nie można połączyć z serwerem. Sprawdź czy backend działa.",
      );
    }

    throw error;
  }
}
```

### **Wyjaśnienie kodu**

#### `import.meta.env.VITE_API_URL`

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

**Co to robi?** Odczytuje zmienną środowiskową `VITE_API_URL` z pliku `.env.local`. Jeśli nie istnieje, używa `localhost:3001`.

**Dlaczego?** W development używasz `localhost:3001`, ale w produkcji będziesz używał `https://twoj-backend.onrender.com`. Zmienna środowiskowa pozwala łatwo przełączać między nimi.

---

#### `...(previousResponseId && { previousResponseId })`

```typescript
const requestBody: ChatRequest = {
  message,
  ...(previousResponseId && { previousResponseId }),
};
```

**Co to robi?** Spread operator (`...`) dodaje `previousResponseId` do obiektu **tylko jeśli istnieje**.

**Przykład**:

- Pierwsza wiadomość: `{ message: "Cześć" }` (brak previousResponseId)
- Druga wiadomość: `{ message: "Jak robić zdjęcia?", previousResponseId: "chatcmpl-123" }`

---

#### `response.ok`

```typescript
if (!response.ok) {
  throw new Error(...);
}
```

**Co to robi?** Sprawdza czy HTTP status jest 200-299 (sukces). Jeśli nie (np. 400, 500), rzuca błąd.

**Bez tego** aplikacja próbowałaby parsować JSON z błędu i crashowałaby.

---

#### Error Handling

```typescript
if (error instanceof TypeError && error.message.includes("fetch")) {
  throw new Error("Nie można połączyć z serwerem...");
}
```

**Co to robi?** Wykrywa błąd sieci (np. backend nie działa) i zamienia techniczny komunikat na user-friendly.

**Przykład**:

- ❌ Technical: `TypeError: Failed to fetch`
- ✅ User-friendly: `Nie można połączyć z serwerem. Sprawdź czy backend działa.`

---

### Sprawdzenie Environment Variables

**Upewnij się, że masz plik `frontend/.env.local`**:

```env
VITE_API_URL=http://localhost:3001
```

**Ważne**: Zmienne środowiskowe Vite **muszą** zaczynać się od `VITE_` (tak działa Vite).

---

### Sprawdzenie

- [x] Plik `frontend/src/services/chatService.ts` zaktualizowany
- [x] Funkcja `sendMessage()` wysyła POST do backendu
- [x] Error handling dodany (network errors, HTTP errors)
- [x] Console.log dla debugowania (zobaczysz requesty w DevTools)
- [x] Plik `frontend/.env.local` istnieje z `VITE_API_URL`

---

## 🎯 Task 3.2: Integracja chatService w ChatWindow (0.5h)

### Cel

Podłączenie `chatService.ts` do `ChatWindow.tsx` - zamiana mockowanych odpowiedzi na rzeczywiste wywołania API.

### **Co zmieniamy?**

W Sprint 1 `ChatWindow.tsx` miał mockowane odpowiedzi:

```typescript
// ❌ Sprint 1 (mockowanie)
setTimeout(() => {
  const assistantMessage = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: `[MOCK] Odpowiedź na: "${content}"`,
    timestamp: new Date(),
  };
  addMessage(assistantMessage);
}, 1000);
```

Teraz zamieniamy na:

```typescript
// ✅ Sprint 3 (rzeczywisty API call)
const response = await sendMessage(content, lastAssistantResponseId);
const assistantMessage = {
  id: response.id,
  role: "assistant",
  content: response.message,
  timestamp: new Date(response.timestamp),
};
addMessage(assistantMessage);
```

---

### Plik: `frontend/src/components/chat/ChatWindow.tsx`

**Znajdź funkcję `handleSendMessage`** i **zastąp ją całą** tym kodem:

```typescript
import { sendMessage } from "../../services/chatService";

// ... (reszta importów i kodu)

export function ChatWindow() {
  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    setError,
    clearMessages,
  } = useChatStore();

  const handleSendMessage = async (content: string) => {
    try {
      // 1. Dodaj wiadomość użytkownika do UI
      const userMessage: MessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // 2. Znajdź ostatnie ID odpowiedzi asystenta (dla historii)
      const lastAssistantMessage = messages
        .filter((m) => m.role === "assistant")
        .pop();
      const previousResponseId = lastAssistantMessage?.id;

      console.log("[ChatWindow] Ostatnie ID asystenta:", previousResponseId);

      // 3. Wyczyść poprzednie błędy i ustaw loading
      setError(null);
      setLoading(true);

      // 4. Wyślij do backendu (rzeczywisty API call)
      const response = await sendMessage(content, previousResponseId);

      // 5. Dodaj odpowiedź AI do UI
      const assistantMessage: MessageType = {
        id: response.id, // ✅ Prawdziwe ID z OpenAI
        role: "assistant",
        content: response.message, // ✅ Prawdziwa odpowiedź AI
        timestamp: new Date(response.timestamp),
      };
      addMessage(assistantMessage);
    } catch (error) {
      console.error("[ChatWindow] Błąd podczas wysyłania:", error);

      // Wyświetl błąd w UI
      const errorMessage =
        error instanceof Error ? error.message : "Nieznany błąd";
      setError(`Nie udało się wysłać wiadomości: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ... (reszta komponentu)
}
```

### **Wyjaśnienie kodu**

#### 1. Znajdź ostatnie ID asystenta

```typescript
const lastAssistantMessage = messages
  .filter((m) => m.role === "assistant")
  .pop();
const previousResponseId = lastAssistantMessage?.id;
```

**Co to robi?**

- Filtruje tylko wiadomości asystenta (`role: 'assistant'`)
- Bierze ostatnią (`.pop()`)
- Wyciąga jej `id` (to będzie `previous_response_id` dla OpenAI)

**Dlaczego?** OpenAI potrzebuje ID poprzedniej odpowiedzi, żeby zachować kontekst rozmowy.

**Przykład Flow**:

```
User: "Jak robić zdjęcia nocne?"
→ Backend → OpenAI → response.id = "chatcmpl-abc123"
→ Assistant message zapisany z id = "chatcmpl-abc123"

User: "A bez tripodu?"
→ lastAssistantMessage.id = "chatcmpl-abc123"
→ previousResponseId = "chatcmpl-abc123"
→ Backend wysyła do OpenAI z previous_response_id = "chatcmpl-abc123"
→ OpenAI wie o co chodzi ("bez tripodu" = kontynuacja tematu nocnej fotografii)
```

---

#### 2. Wywołanie API

```typescript
const response = await sendMessage(content, previousResponseId);
```

**Co to robi?** Wywołuje funkcję z `chatService.ts`, która wysyła HTTP request do backendu.

**Dlaczego `await`?** To asynchroniczna operacja (trwa kilka sekund) - musimy poczekać na odpowiedź.

---

#### 3. Error Handling

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
  setError(`Nie udało się wysłać wiadomości: ${errorMessage}`);
}
```

**Co to robi?** Jeśli coś pójdzie nie tak (np. backend nie odpowiada), wyświetl błąd w UI.

**UX**: Użytkownik zobaczy czerwony komunikat zamiast zawieszonej aplikacji.

---

#### 4. Finally Block

```typescript
finally {
  setLoading(false);
}
```

**Co to robi?** Zawsze wyłącz loading spinner - czy request się udał, czy nie.

**Bez tego** spinner kręciłby się w nieskończoność po błędzie.

---

### Sprawdzenie

- [x] Funkcja `handleSendMessage` zaktualizowana
- [x] Import `sendMessage` z `chatService.ts` dodany
- [x] Wykrywanie `lastAssistantMessage.id` dla historii
- [x] Error handling dodany (wyświetlanie błędów w UI)
- [x] Loading state zarządzany poprawnie (`.finally()`)

---

## 🎯 Task 3.3: Weryfikacja Persystencji localStorage (0.25h)

### Cel

Upewnienie się, że historia rozmowy **przetrwa odświeżenie strony** (localStorage działa poprawnie z rzeczywistym API).

### **Co to jest localStorage?**

localStorage to "sejf w przeglądarce" - przechowuje dane lokalnie, nawet po zamknięciu karty/przeglądarki.

**Analogia**: Jak "notatnik" - zapisujesz rozmowę, zamykasz notatnik, otwierasz ponownie - rozmowa nadal tam jest.

**Kod**:

```typescript
// Zapisz do localStorage
localStorage.setItem("chat-storage", JSON.stringify(data));

// Odczytaj z localStorage
const data = JSON.parse(localStorage.getItem("chat-storage"));
```

**Zustand persist middleware** robi to automatycznie! (kod z Sprint 1)

---

### Test Manualny

1. **Uruchom aplikację**:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Wyślij kilka wiadomości** (np. "Jak robić zdjęcia nocne?", "A bez tripodu?")

3. **Sprawdź localStorage**:
   - Otwórz DevTools (F12)
   - Zakładka **Application** → **Local Storage** → `http://localhost:5173`
   - Powinien być klucz `chat-storage` z danymi JSON

4. **Odśwież stronę** (F5)

5. **Sprawdź**:
   - ✅ Historia rozmowy nadal widoczna (wiadomości się zachowały)
   - ✅ Nowa wiadomość kontynuuje rozmowę (previousResponseId działa)

---

### Debug localStorage (jeśli coś nie działa)

Otwórz DevTools → Console i wpisz:

```javascript
// Odczytaj dane
JSON.parse(localStorage.getItem("chat-storage"));

// Wyczyść localStorage (reset)
localStorage.clear();
```

---

### Weryfikacja Kodu (czy persist middleware jest aktywny)

Otwórz `frontend/src/store/chatStore.ts` i **upewnij się**, że jest:

```typescript
import { persist } from "zustand/middleware";

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      // ...
    }),
    {
      name: "chat-storage", // 👈 Klucz w localStorage
    },
  ),
);
```

**Jeśli tego nie ma** - dodaj `persist` wrapper (kod z Sprint 1, Task 1.7).

---

### Sprawdzenie

- [x] Po wysłaniu wiadomości data pojawia się w localStorage (`Application` tab)
- [x] Po odświeżeniu strony (F5) wiadomości się zachowują
- [x] Nowa wiadomość kontynuuje rozmowę (previousResponseId jest wykrywany)
- [x] `chat-storage` klucz widoczny w DevTools → Application → Local Storage

---

## 🎯 Task 3.4: UX Improvements (0.75h)

### Cel

Dodanie elementów UX, które poprawiają doświadczenie użytkownika:

- **Loading states** (spinner podczas ładowania)
- **Error messages** (wyświetlanie błędów)
- **Clear Chat button** (czyszczenie historii)
- **Empty state** (gdy brak wiadomości)

---

### 3.4.1: Wyświetlanie Błędów w UI

**Gdzie?** W `ChatWindow.tsx`, nad `MessageList`.

**Znajdź return statement** w `ChatWindow.tsx` i **dodaj** przed `<MessageList>`:

```typescript
import { Alert, AlertDescription } from '../ui/alert-dialog';

export function ChatWindow() {
  const { messages, isLoading, error, clearMessages, setError } = useChatStore();

  // ... handleSendMessage ...

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header czatu */}
      <div className="bg-linear-to-r from-purple-600 to-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">📸 FOTAI</h1>
        <p className="text-sm opacity-90">Zapytaj o fotografię, kompozycję, sprzęt...</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Wystąpił błąd</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MessageList */}
      <MessageList messages={messages} />

      {/* ChatInput */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
```

**Co to robi?**

- Jeśli `error` istnieje → wyświetl czerwony alert z komunikatem
- Przycisk **✕** czyści błąd (wywołuje `setError(null)`)

---

### 3.4.2: Clear Chat Button

**Gdzie?** W headerze `ChatWindow.tsx`, obok tytułu.

**Zastąp header** tym kodem:

```typescript
{/* Header czatu z Clear Button */}
<div className="bg-linear-to-r from-purple-600 to-blue-600 text-white p-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-xl font-bold">📸 FOTAI</h1>
      <p className="text-sm opacity-90">Zapytaj o fotografię, kompozycję, sprzęt...</p>
    </div>

    {/* Clear Chat Button */}
    {messages.length > 0 && (
      <button
        onClick={() => {
          if (confirm('Czy na pewno chcesz wyczyścić historię rozmowy?')) {
            clearMessages();
          }
        }}
        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
      >
        🗑️ Wyczyść czat
      </button>
    )}
  </div>
</div>
```

**Co to robi?**

- Przycisk pojawia się **tylko** gdy są wiadomości (`messages.length > 0`)
- Przed wyczyszczeniem pyta o potwierdzenie (`confirm()`)
- Wywołuje `clearMessages()` z Zustand store (czyści `messages` i localStorage)

---

### 3.4.3: Loading Spinner w MessageList

**Gdzie?** W `MessageList.tsx`, na końcu listy.

**Otwórz `frontend/src/components/chat/MessageList.tsx`** i **dodaj** `isLoading` prop:

```typescript
import { Spinner } from '../ui/spinner';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean; // 👈 Nowy prop
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]); // 👈 Dodaj isLoading do dependencies

  return (
    <ScrollArea className="flex-1 p-4 bg-gray-50">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">👋 Witaj w FOTAI!</p>
            <p className="text-sm">Zapytaj o cokolwiek związanego z fotografią</p>
            <p className="text-xs text-gray-400 mt-4">
              Przykłady: "Jak robić zdjęcia nocne?", "Jaki obiektyw do portretów?"
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Message key={msg.id} {...msg} />
            ))}

            {/* Loading Spinner */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span className="text-sm text-gray-600">AI pisze odpowiedź...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
```

**Następnie zmień wywołanie w `ChatWindow.tsx`**:

```typescript
<MessageList messages={messages} isLoading={isLoading} />
```

**Co to robi?**

- Gdy `isLoading === true` → wyświetl spinner + tekst "AI pisze odpowiedź..."
- Auto-scroll na dół działa też dla spinnera

---

### 3.4.4: Sprawdź Shadcn/ui Spinner

Jeśli nie masz komponentu `Spinner`, dodaj go:

```bash
cd frontend
npx shadcn@latest add spinner
```

Jeśli Shadcn nie ma `spinner`, użyj prostego CSS:

```typescript
// frontend/src/components/ui/spinner.tsx
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
    />
  );
}
```

---

### Sprawdzenie

- [x] Error alert wyświetla się gdy wystąpi błąd (czerwone tło, ⚠️ ikona)
- [x] Przycisk **Wyczyść czat** pojawia się gdy są wiadomości
- [x] Po kliknięciu "Wyczyść czat" → confirm dialog → wiadomości są usuwane
- [x] localStorage jest czyszczony (sprawdź DevTools)
- [x] Loading spinner pojawia się podczas ładowania (między wysłaniem a odpowiedzią)
- [x] Empty state wyświetla się gdy brak wiadomości

---

## 🎯 Task 3.5: Deploy Backend na Render (0.5h)

### Cel

Wdrożenie backendu na platformę Render (darmowy hosting dla Node.js).

### **Czym jest Render?**

Render to platforma cloud do hostingu aplikacji (backend, frontend, bazy danych). Alternatywa dla Heroku.

**Plan Free Tier**:

- ✅ 750h/miesiąc za darmo (wystarczy na 1 backend)
- ✅ SSL (HTTPS) automatycznie
- ⚠️ Cold start (15-30s przy pierwszym requeście po braku aktywności)

---

### Kroki

#### 1. Przygotowanie Repozytorium Git

**Render wymaga kodu na GitHubie** (lub GitLabie, Gitea).

**Upewnij się, że masz repozytorium Git**:

```bash
# W głównym folderze fotai.app
git status

# Jeśli nie ma repo, zainicjuj:
git init
git add .
git commit -m "feat: sprint-1-2-3-ready-for-deploy"

# Stwórz repo na GitHubie i wpchnij kod:
git remote add origin https://github.com/twoj-username/fotai.app.git
git push -u origin main
```

---

#### 2. Dodaj Plik `render.yaml` (opcjonalnie)

Utwórz w **głównym folderze** `fotai.app/render.yaml`:

```yaml
services:
  - type: web
    name: promptly-backend
    env: node
    region: frankfurt # lub oregon, singapore
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: OPENAI_API_KEY
        sync: false # Będziesz ustawiać manualnie w dashboardzie
      - key: OPENAI_MODEL
        value: gpt-4o-mini
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
```

**Commit i push**:

```bash
git add render.yaml
git commit -m "chore: add render.yaml config"
git push
```

---

#### 3. Deploy na Render

1. **Zarejestruj się** na [render.com](https://render.com) (możesz użyć GitHub login)

2. **Kliknij "New +"** → **"Web Service"**

3. **Połącz repozytorium GitHub**:
   - Wybierz `fotai.app`
   - Autoryzuj Render do dostępu

4. **Konfiguracja**:
   - **Name**: `promptly-backend` (lub dowolna nazwa)
   - **Region**: Frankfurt / Oregon (wybierz bliżej siebie)
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **WAŻNE** (inaczej Render nie znajdzie package.json)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables** (zakładka "Environment"):
   - `OPENAI_API_KEY` = twój klucz z OpenAI
   - `OPENAI_MODEL` = `gpt-4o-mini`
   - `NODE_ENV` = `production`
   - `SYSTEM_PROMPT` = (skopiuj z `backend/.env`)
   - `PORT` = `3001`

6. **Kliknij "Create Web Service"**

---

#### 4. Czekaj na Deploy

Render zacznie build (trwa 3-5 minut):

- Instaluje npm dependencies
- Kompiluje TypeScript (`npm run build`)
- Uruchamia serwer (`npm start`)

**Gdy status = "Live" (zielony)** → backend jest online! 🎉

---

#### 5. Testuj Backend

Render da Ci URL typu: `https://promptly-backend-abcd.onrender.com`

**Test w przeglądarce**:

```
https://promptly-backend-abcd.onrender.com/health
```

Powinno zwrócić:

```json
{
  "status": "ok",
  "timestamp": "2026-02-11T10:30:00Z"
}
```

**Test z cURL** (w terminalu):

```bash
curl -X POST https://promptly-backend-abcd.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Jak robić zdjęcia nocne?"}'
```

Powinno zwrócić odpowiedź AI.

---

### Cold Start na Render Free Tier

⚠️ **Ważne**: Darmowy plan Render "zasypia" backend po 15 minutach braku aktywności. Pierwszy request po przebudzeniu trwa 15-30s.

**Rozwiązanie** (opcjonalnie):

- Stwórz Cron Job, który co 10 minut wysyła request do `/health` (utrzymuje backend "obudzony")
- Lub zaakceptuj cold start (dla MVP to OK)

---

### Sprawdzenie

- [x] Backend wdrożony na Render (status "Live")
- [x] URL backendu dostępny (np. `https://promptly-backend-abcd.onrender.com`)
- [x] `/health` endpoint zwraca `{ status: "ok" }`
- [x] `/api/chat` endpoint przyjmuje requesty i zwraca odpowiedzi AI
- [x] Environment variables skonfigurowane (OPENAI_API_KEY, etc.)
- [x] Brak błędów w logach Render (zakładka "Logs")

---

## 🎯 Task 3.6: Deploy Frontend na Vercel (0.5h)

### Cel

Wdrożenie frontendu na Vercel (najlepsza platforma dla React/Vite).

### **Czym jest Vercel?**

Vercel to platforma cloud dla frontendów (React, Next.js, Vue, Svelte). Stworzony przez twórców Next.js.

**Plan Free Tier**:

- ✅ 100 GB bandwidth/miesiąc
- ✅ Automatyczny SSL (HTTPS)
- ✅ Global CDN (szybkie ładowanie na całym świecie)
- ✅ Automatyczne deploye z Git (każdy push → deploy)

---

### Kroki

#### 1. Dodaj Plik `vercel.json` w Frontend

**Utwórz plik `frontend/vercel.json`**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Co to robi?**

- `rewrites` - wszystkie ścieżki kierują na `index.html` (React Router działa poprawnie)

**Commit i push**:

```bash
git add frontend/vercel.json
git commit -m "chore: add vercel config"
git push
```

---

#### 2. Deploy na Vercel

1. **Zarejestruj się** na [vercel.com](https://vercel.com) (użyj GitHub login)

2. **Kliknij "Add New..."** → **"Project"**

3. **Import repozytorium GitHub**:
   - Wybierz `fotai.app`

4. **Konfiguracja**:
   - **Project Name**: `fotai.app` (lub dowolna nazwa)
   - **Framework Preset**: Vite (auto-detect powinno to znaleźć)
   - **Root Directory**: `frontend` ⚠️ **WAŻNE** (inaczej Vercel nie znajdzie package.json)
   - **Build Command**: `npm run build` (auto-fill)
   - **Output Directory**: `dist` (auto-fill)

5. **Environment Variables** (zakładka "Environment Variables"):
   - `VITE_API_URL` = `https://promptly-backend-abcd.onrender.com` (URL backendu z Task 3.5)

   ⚠️ **Ważne**: Zamień `abcd` na prawdziwy URL z Render!

6. **Kliknij "Deploy"**

---

#### 3. Czekaj na Deploy

Vercel zacznie build (trwa 1-2 minuty):

- Instaluje npm dependencies
- Uruchamia `npm run build` (Vite kompiluje React do statycznych plików)
- Uploaduje do CDN

**Gdy status = "Ready" (✅)** → frontend jest online! 🎉

---

#### 4. Testuj Frontend

Vercel da Ci URL typu: `https://fotai.app-xyz.vercel.app`

**Otwórz w przeglądarce**:

```
https://fotai.app-xyz.vercel.app
```

**Sprawdź**:

- ✅ Strona się ładuje
- ✅ Header, MessageList, ChatInput widoczne
- ✅ Możesz wpisać wiadomość i wysłać
- ✅ Otrzymujesz odpowiedź od AI (prawdziwa, nie mockowana)

---

### Custom Domain (opcjonalnie)

Jeśli masz własną domenę (np. `promptly.yourdomain.com`):

1. Zakładka **"Settings"** → **"Domains"**
2. Dodaj swoją domenę
3. Skonfiguruj DNS (Vercel pokaże instrukcje)

---

### Sprawdzenie

- [x] Frontend wdrożony na Vercel (status "Ready")
- [x] URL frontendu dostępny (np. `https://fotai.app-xyz.vercel.app`)
- [x] Aplikacja ładuje się bez błędów
- [x] Możesz wysłać wiadomość i otrzymać odpowiedź AI
- [x] Environment variable `VITE_API_URL` skonfigurowana poprawnie
- [x] Brak błędów w konsoli przeglądarki (F12 → Console)

---

## 🎯 Task 3.7: Konfiguracja CORS dla Produkcji (0.25h)

### Cel

Upewnienie się, że backend akceptuje requesty z frontendu produkcyjnego (nie tylko `localhost`).

### **Problem CORS**

W development backend akceptuje requesty z `http://localhost:5173`. W produkcji frontend jest na `https://fotai.app-xyz.vercel.app` - musisz dodać ten origin do CORS.

---

### Zmiana w Backend

**Otwórz `backend/src/index.ts`** i **zmień konfigurację CORS**:

```typescript
// Zamiast:
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Użyj:
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Development
      "https://fotai.app-xyz.vercel.app", // Production (zamień URL)
    ],
    credentials: true,
  }),
);
```

**⚠️ Ważne**: Zamień `fotai.app-xyz.vercel.app` na **prawdziwy URL** z Vercel!

---

### Alternatywa: Environment Variable

Lepsze rozwiązanie - dodaj zmienną środowiskową:

**W `backend/src/index.ts`**:

```typescript
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
```

**Następnie w Render** (zakładka Environment):

- `FRONTEND_URL` = `http://localhost:5173,https://fotai.app-xyz.vercel.app`

**Commit i push**:

```bash
git add backend/src/index.ts
git commit -m "fix: update CORS for production"
git push
```

Render automatycznie zrobi redeploy (3-5 minut).

---

### Sprawdzenie

- [x] CORS skonfigurowany dla frontendu produkcyjnego
- [x] Backend (Render) akceptuje requesty z frontendu (Vercel)
- [x] Brak błędów CORS w konsoli przeglądarki (F12 → Console)
- [x] Frontend produkcyjny może wysyłać wiadomości i otrzymywać odpowiedzi

---

## 🎯 Task 3.8: End-to-End Testing Produkcji (0.5h)

### Cel

Przeprowadzenie pełnych testów aplikacji produkcyjnej (frontend + backend online).

### **Czym jest E2E Testing?**

End-to-End = testowanie całego flow'u od początku do końca:

1. Użytkownik otwiera stronę
2. Wpisuje wiadomość
3. Wysyła
4. Otrzymuje odpowiedź
5. Historia się zachowuje po refreshu

---

### Testy Manualne

#### Test 1: Podstawowy Flow

1. **Otwórz frontend** (URL z Vercel)
2. **Wyślij wiadomość**: "Jak robić zdjęcia nocne?"
3. **Sprawdź**:
   - ✅ Wiadomość pojawia się w UI
   - ✅ Loading spinner pojawia się
   - ✅ Odpowiedź AI pojawia się (prawdziwa, z systemem prompt fotograficznym)
   - ✅ Timestamp jest poprawny
   - ✅ Brak błędów w konsoli (F12 → Console)

#### Test 2: Kontynuacja Rozmowy (previousResponseId)

1. **Wyślij pierwszą wiadomość**: "Jak robić zdjęcia nocne?"
2. **Poczekaj na odpowiedź**
3. **Wyślij drugą wiadomość**: "A bez tripodu?"
4. **Sprawdź**:
   - ✅ AI rozumie kontekst ("bez tripodu" odnosi się do nocnej fotografii)
   - ✅ Odpowiedź jest spójna z poprzednią

#### Test 3: localStorage Persistence

1. **Wyślij kilka wiadomości**
2. **Odśwież stronę** (F5)
3. **Sprawdź**:
   - ✅ Historia rozmowy się zachowała
   - ✅ Możesz kontynuować rozmowę (nowa wiadomość używa previousResponseId)

#### Test 4: Clear Chat

1. **Wyślij kilka wiadomości**
2. **Kliknij "Wyczyść czat"**
3. **Potwierdź** w dialogu
4. **Sprawdź**:
   - ✅ Wszystkie wiadomości zniknęły
   - ✅ localStorage wyczyszczony (DevTools → Application → Local Storage)

- ✅ Empty state pojawia się ("👋 Witaj w FOTAI!")

#### Test 5: Error Handling

1. **Zatrzymaj backend** (w Render → Settings → Suspend Service) - **opcjonalnie**
2. **Wyślij wiadomość**
3. **Sprawdź**:
   - ✅ Czerwony alert pojawia się z komunikatem błędu
   - ✅ Aplikacja nie crashuje
   - ✅ Przycisk **✕** czyści błąd

#### Test 6: Mobile Responsiveness

1. **Otwórz DevTools** (F12)
2. **Włącz Device Toolbar** (Ctrl + Shift + M)
3. **Wybierz urządzenie** (np. iPhone 12, Galaxy S21)
4. **Sprawdź**:
   - ✅ Layout jest responsywny (komponenty nie wykraczają poza ekran)
   - ✅ ChatInput jest widoczny i użyteczny
   - ✅ MessageList scrolluje się poprawnie

---

### Sprawdzenie

- [x] Podstawowy flow działa (wyślij → otrzymaj odpowiedź)
- [x] Kontynuacja rozmowy działa (previousResponseId)
- [x] localStorage przechowuje historię po refreshu
- [x] Clear Chat czyści wiadomości i localStorage
- [x] Error handling wyświetla błędy (jeśli backend nie odpowiada)
- [x] Mobile responsiveness OK (DevTools → Device Toolbar)
- [x] System prompt działa (odpowiedzi są fotograficzne, kończą się zaproszeniem na [fotowarsztaty.com](https://fotowarsztaty.com))
- [x] Brak błędów w konsoli przeglądarki (F12 → Console)
- [x] Brak błędów w logach backendu (Render → Logs)

---

## 🎯 Task 3.9: Final Polish (0.5h)

### Cel

Dopracowanie ostatnich szczegółów: favicon, meta tags, README update.

---

### 3.9.1: Favicon

**Znajdź/stwórz ikonę** (np. 📸 emoji jako PNG, lub użyj [favicon.io](https://favicon.io/emoji-favicons/camera/))

**Dodaj do `frontend/public/favicon.ico`**:

```bash
# Pobierz favicon i zapisz w frontend/public/
# Lub użyj istniejącego favicon.svg z Vite template
```

**Zmień w `frontend/index.html`**:

```html
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Meta Tags for SEO & Social Media -->
    <title>FOTAI - Photography Assistant</title>
    <meta
      name="description"
      content="AI asystent fotograficzny - porady o technice, kompozycji, sprzęcie i obróbce zdjęć"
    />
    <meta
      name="keywords"
      content="fotografia, AI, asystent, porady fotograficzne, sprzęt"
    />

    <!-- Open Graph (Facebook, LinkedIn) -->
    <meta property="og:title" content="FOTAI" />
    <meta
      property="og:description"
      content="AI asystent fotograficzny - porady o technice, kompozycji, sprzęcie"
    />
    <meta property="og:type" content="website" />
    <meta
      property="og:image"
      content="https://twoj-url.vercel.app/og-image.png"
    />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FOTAI" />
    <meta name="twitter:description" content="AI asystent fotograficzny" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### 3.9.2: README Update

**Zaktualizuj główny `README.md`** - dodaj linki do live demo:

```markdown
# FOTAI - AI Photography Assistant

> 🚀 **Live Demo**: [fotai.app.vercel.app](https://fotai.app-xyz.vercel.app)  
> 🔗 **Backend**: [promptly-backend.onrender.com](https://promptly-backend-abcd.onrender.com/health)  
> 💻 **GitHub**: [twoj-username/fotai.app](https://github.com/twoj-username/fotai.app)

⚠️ **Zamień** w powyższych linkach na prawdziwe URL!
```

---

### 3.9.3: Screenshot dla Portfolio

1. **Otwórz aplikację** (live demo)
2. **Wyślij kilka wiadomości** (żeby pokazać UI z rozmową)
3. **Zrób screenshot** (Print Screen lub Snipping Tool)
4. **Zapisz jako `screenshots/app-preview.png`** w repo

**Dodaj do README**:

```markdown
## 📸 Screenshots

![App Preview](./screenshots/app-preview.png)
```

---

### 3.9.4: Commit i Push

```bash
git add .
git commit -m "feat: final polish - favicon, meta tags, README update"
git push
```

Vercel automatycznie zrobi redeploy frontendu (1-2 minuty).

---

### Sprawdzenie

- [x] Favicon widoczny w zakładce przeglądarki
- [x] Meta tags dodane (title, description, Open Graph)
- [x] README zaktualizowane z linkami do live demo
- [x] Screenshot aplikacji dodany do repo (opcjonalnie)
- [x] Ostatni commit na GitHubie
- [x] Vercel automatycznie zrobił redeploy

---

## ✅ Checklist Sprint 3 - Finał

### Weryfikacja techniczna

- [ ] Frontend komunikuje się z backendem (rzeczywiste odpowiedzi AI) ✅
- [ ] Historia rozmowy zapisuje się w localStorage ✅
- [ ] Po refresh strony historia się zachowuje ✅
- [ ] previousResponseId działa (kontynuacja rozmowy) ✅
- [ ] Loading states działają (spinner podczas ładowania) ✅
- [ ] Error handling działa (czerwony alert przy błędach) ✅
- [ ] Clear Chat button czyści wiadomości i localStorage ✅
- [ ] Backend wdrożony na Render (Live) ✅
- [ ] Frontend wdrożony na Vercel (Live) ✅
- [ ] CORS skonfigurowany poprawnie (frontend może łączyć się z backendem) ✅
- [ ] System prompt działa (odpowiedzi fotograficzne + zaproszenie na [fotowarsztaty.com](https://fotowarsztaty.com)) ✅

### Weryfikacja produkcji

- [ ] Live demo działa bez błędów ✅
- [ ] Podstawowy flow: wyślij → otrzymaj odpowiedź ✅
- [ ] Kontynuacja rozmowy: druga wiadomość rozumie kontekst ✅
- [ ] Mobile responsiveness OK (test w DevTools) ✅
- [ ] Brak błędów w konsoli przeglądarki ✅
- [ ] Brak błędów w logach Render ✅

### Polish & Dokumentacja

- [ ] Favicon dodany ✅
- [ ] Meta tags (title, description, Open Graph) ✅
- [ ] README zaktualizowane z linkami do live demo ✅
- [ ] Screenshot aplikacji (opcjonalnie) ✅
- [ ] Kod scommitowany do Git ✅

### Sprawdzenie produkcji (URL)

- [ ] **Frontend URL**: `https://fotai.app-xyz.vercel.app` (zamień na prawdziwy)
- [ ] **Backend URL**: `https://promptly-backend-abcd.onrender.com` (zamień na prawdziwy)
- [ ] **GitHub Repo**: `https://github.com/twoj-username/fotai.app`

---

## 🎉 Gratulacje! MVP Phase 1 Ukończony!

**Co osiągnąłeś?**

- ✅ **Full-Stack App**: React frontend + Express backend
- ✅ **AI Integration**: Prawdziwe odpowiedzi z OpenAI (GPT-4)
- ✅ **Deployed Online**: Vercel (frontend) + Render (backend)
- ✅ **Historia Rozmowy**: localStorage + previousResponseId
- ✅ **UX Polished**: Loading states, error handling, clear chat
- ✅ **Portfolio Ready**: Gotowy projekt do pokazania pracodawcom

**Twój stack**:

- Frontend: React 18 + Vite + TypeScript + TailwindCSS + Shadcn/ui
- State: Zustand + localStorage
- Backend: Express.js + TypeScript + OpenAI SDK
- Deployment: Vercel + Render
- Version Control: Git + GitHub

---

## 🚀 Co dalej? Phase 2+

### Phase 2: Konta Użytkowników & Historia Chatów (Q2 2026)

**Features**:

- Rejestracja i logowanie użytkowników (JWT auth)
- Zapisywanie rozmów w bazie danych (PostgreSQL)
- Możliwość tworzenia wielu chatów
- Sidebar z historią rozmów
- Dashboard użytkownika

**Stack dodatkowy**:

- PostgreSQL (Neon/Supabase)
- Prisma ORM
- JWT + bcrypt

**Sprinty**:

- Sprint 4: Setup bazy danych (PostgreSQL + Prisma)
- Sprint 5: Autentykacja (JWT, login/register endpoints)
- Sprint 6: Zapisywanie rozmów do DB
- Sprint 7: UI dla historii chatów (sidebar, tworzenie nowych rozmów)

---

### Phase 3: Upload & Ocena Zdjęć (Q3 2026)

**🔄 MIGRACJA DO NEXT.JS** - Najbardziej sensowny moment

**Features**:

- Upload zdjęć przez użytkownika
- AI analizuje zdjęcie (kompozycja, ekspozycja, balans bieli)
- AI podaje ocenę i sugestie poprawy
- Historia zdjęć z ocenami w profilu

**API**:

- OpenAI Vision API (GPT-4V)
- Next.js Image Optimization

---

### Phase 4: Edycja Zdjęć przez AI (Q4 2026+)

**Features**:

- Komendy tekstowe: "usuń drzewo", "dodaj chmury"
- AI wykonuje edycję (DALL-E API)
- Before/after preview
- Eksport edytowanych zdjęć

---

## 💡 Porady Początkującym

### Co zrobiłeś w Sprint 3?

✅ **Integracja Full-Stack**: Połączyłeś frontend z backendem  
✅ **Deployment**: Wdrożyłeś aplikację na produkcję (Vercel + Render)  
✅ **localStorage**: Historia rozmowy przetrwa refresh  
✅ **UX**: Loading states, error handling, clear chat  
✅ **Production Ready**: Aplikacja publicznie dostępna! 🎉

### Problemy podczas Sprint 3?

- **CORS errors**: Sprawdź czy backend akceptuje origin frontendu
- **Backend nie odpowiada**: Sprawdź logi Render (zakładka Logs)
- **Frontend nie łączy się z backendem**: Sprawdź `VITE_API_URL` (musi być URL z Render, nie localhost)
- **localStorage nie działa**: Sprawdź czy `persist` middleware jest aktywny w `chatStore.ts`
- **Cold start na Render**: Pierwszy request po braku aktywności trwa 15-30s (free tier)

---

## 📚 Dodatkowe Zasoby

### Deployment

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)

### CORS

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### localStorage

- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Error Handling

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

**Sprint Leader**: [Twoje imię]  
**Data rozpoczęcia**: 11.02.2026  
**Data zakończenia**: \***\*\_\_\_\*\***  
**Status**: 🟡 W trakcie / ✅ Ukończony

**Commit message po zakończeniu**:

```bash
git add .
git commit -m "feat: sprint-3-integration-deploy - MVP ONLINE 🚀"
git push origin main
```

---

## 🔗 Quick Links

- **Live Demo**: [Twój URL z Vercel]
- **Backend Health**: [Twój URL z Render]/health
- **GitHub Repo**: [Twoje repo]
- **README**: [../README.md](./README.md)
- **Sprint 1**: [./SPRINT-1.md](./SPRINT-1.md)
- **Sprint 2**: [./SPRINT-2.md](./SPRINT-2.md)

---

**🎉 CONGRATULATIONS! Your app is LIVE! 🚀📸**
