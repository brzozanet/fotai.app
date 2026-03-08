# REVIEW.md

Code review wykonane przez **GitHub Copilot**, za pomocą modelu **GPT-5.3-Codex**.

Repozytorium projektu: https://github.com/brzozanet/promptly-photo-ai

## Code Review projektu Promptly (`frontend` + `backend`)

Data review: 2026-03-08  
Zakres: analiza folderów `frontend` i `backend` (bez `scrum`)

## Najważniejsze findings (od najpoważniejszych)

### 1. [KRYTYCZNE] Backend może zostawić request bez odpowiedzi przy części błędów

- Plik: `backend/src/routes/chat.ts:53`
- Problem: W `catch` odpowiedź jest zwracana tylko, gdy `error` ma pole `status`. Dla innych wyjątków funkcja kończy się bez `return response...`, co może powodować wiszące requesty i timeouty po stronie klienta.
- Ryzyko: zawieszanie API, bardzo trudny debugging w produkcji.
- Rekomendacja: dodać fallback `return response.status(500).json(...)` dla każdego błędu + logowanie szczegółów po stronie serwera.

### 2. [WYSOKIE] Frontend wysyła zapytanie po `Enter` nawet gdy input jest niepoprawny

- Plik: `frontend/src/components/chat/ChatInput.tsx:53`
- Problem: `handleKeyDown` wywołuje `sendPrompt(...)` dla każdego `Enter`, bez walidacji `isInputValid` i bez `event.preventDefault()` dla multiline (`Shift+Enter`).
- Efekt uboczny: można wysłać pustą lub za krótką wiadomość mimo zablokowanego przycisku.
- Rekomendacja: obsłużyć tylko `Enter && !shiftKey`, dodać guard walidacji na początku `sendPrompt`, dla pozostałych przypadków pozwolić na nową linię.

### 3. [WYSOKIE] Rzucanie błędu w handlerze UI po `catch` może destabilizować aplikację

- Plik: `frontend/src/components/chat/ChatInput.tsx:44`
- Problem: Po obsłużeniu błędu (`setError(true)`) kod robi `throw new Error(...)`.
- Ryzyko: nieobsłużone wyjątki w event handlerze React, potencjalny crash i gorszy UX.
- Rekomendacja: nie re-throwować tutaj; wystarczy ustawić stan błędu i ewentualnie pokazać toast/alert.

### 4. [WYSOKIE] Renderowanie linków markdown nadpisuje wszystkie URL-e na jeden adres

- Plik: `frontend/src/components/chat/Message.tsx:47`
- Problem: custom renderer `a` ignoruje rzeczywisty link i zawsze ustawia `href="https://fotowarsztaty.com"`.
- Ryzyko: zafałszowanie treści odpowiedzi, potencjalnie mylące i niebezpieczne zachowanie.
- Rekomendacja: użyć `href` z propsów ReactMarkdown i ewentualnie filtrować dozwolone domeny.

### 5. [ŚREDNIE] Brak walidacji zmiennych środowiskowych przy starcie backendu

- Plik: `backend/src/routes/chat.ts:14`
- Problem: `OPENAI_MODEL` i `SYSTEM_PROMPT` mogą być `undefined`; błąd wychodzi dopiero runtime przy requestach.
- Ryzyko: niestabilny start i późne wykrywanie błędnej konfiguracji.
- Rekomendacja: walidacja env na starcie aplikacji (fail-fast).

### 6. [ŚREDNIE] Persistowany jest stan techniczny (`isLoading`, `error`)

- Plik: `frontend/src/store/chatStore.ts:6`
- Problem: middleware `persist` zapisuje cały store, w tym flagi chwilowe.
- Ryzyko: po odświeżeniu można odziedziczyć błędny stan UI (np. alert błędu).
- Rekomendacja: użyć `partialize` i persistować tylko `messages` (oraz ewentualnie metadane rozmowy).

### 7. [NISKIE] Link otwierany w nowej karcie bez `rel="noopener noreferrer"`

- Plik: `frontend/src/pages/AboutPage.tsx:32`
- Problem: `target="_blank"` bez pełnego `rel` to ryzyko reverse tabnabbing.
- Rekomendacja: dodać `rel="noopener noreferrer"`.

### 8. [NISKIE] Brak fallbacku routingu 404/error element

- Plik: `frontend/src/index.tsx:31`
- Problem: jest TODO dla `errorElement`, ale brak implementacji.
- Ryzyko: słaby UX przy złym URL lub błędzie routingu.
- Rekomendacja: dodać stronę `NotFound` + `errorElement`.

---

## Mocne strony projektu

1. Dobra separacja warstw: frontend (`services`, `store`, `components`) i backend (`routes`, `types`) są czytelnie podzielone.
2. Sensowny, prosty kontrakt API (`ChatRequest`/`ChatResponse`) po obu stronach.
3. Użycie TypeScript strict mode i spójnych interfejsów poprawia bezpieczeństwo zmian.
4. Backend działa jako proxy do OpenAI, więc klucz API nie wycieka do klienta.
5. UI ma spójny kierunek wizualny i sensowną strukturę komponentów (layout/chat/ui).
6. Konfiguracja deploymentu (`vercel.json`) i CORS są przygotowane pod środowisko produkcyjne.

## Słabe strony projektu

1. Obsługa błędów i edge-case’ów w krytycznym flow czatu jest jeszcze niedomknięta.
2. Brakuje fail-fast dla konfiguracji backendu.
3. Część zachowań UI jest podatna na regresje (Enter/multiline/persist transient state).
4. Bezpieczeństwo i wiarygodność linków markdown wymagają poprawy.
5. Brak testów automatycznych dla kluczowego flow (`sendPrompt`, `/api/chat`, obsługa błędów).

## Lista rzeczy do poprawy (priorytety)

### P0 (od razu)

1. Dodać gwarantowany fallback `500` w `backend/src/routes/chat.ts`.
2. Naprawić `Enter`/`Shift+Enter` i walidację przed wysyłką w `ChatInput`.
3. Usunąć `throw new Error(...)` z handlera UI po `catch`.
4. Naprawić renderer linków w `Message.tsx`, aby używał realnego `href`.

### P1 (najbliższy sprint)

1. Walidacja env na starcie backendu (`OPENAI_API_KEY`, `OPENAI_MODEL`, `SYSTEM_PROMPT`, `FRONTEND_URL`).
2. Ograniczenie `persist` do trwałych danych (np. `messages`).
3. Dodać `NotFound`/`errorElement` do routera.
4. Uzupełnić `rel="noopener noreferrer"` dla zewnętrznych linków.

### P2 (stabilizacja i jakość)

1. Dodać testy integracyjne backendu (happy path + 401/429/500).
2. Dodać testy komponentu `ChatInput` (submit, enter behavior, error flow).
3. Uporządkować zaległe TODO i martwy kod (`App.tsx` nieużywany w aktualnym entry flow).

## Podsumowanie oceny

Projekt jest solidnym MVP z czytelną architekturą i dobrym kierunkiem produktowym.  
Największe ryzyka są w odporności na błędy (backend + input flow) i w wiarygodności renderowanych linków.  
Po poprawkach z P0/P1 aplikacja będzie dużo stabilniejsza i bezpieczniejsza w realnym użyciu.
