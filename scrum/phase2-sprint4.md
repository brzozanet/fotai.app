# Sprint 4 Phase 2: Konto użytkownika — FOTAI

> 🎯 **Cel sprintu**: Użytkownik może edytować dane swojego konta (email, hasło, nazwa wyświetlana) oraz trwale usunąć konto — z potwierdzeniem bezpieczeństwa przez wpisanie hasła.

**Timeframe**: pół dnia (3–4h pracy efektywnej)  
**Poziom**: Junior — budujemy na fundamencie z poprzednich sprintów

---

## 📋 Przegląd Sprintu

Do tej pory użytkownik mógł się zarejestrować i zalogować, ale nie mógł zmienić żadnych swoich danych. W tym sprincie budujemy stronę ustawień konta (`/account.html`) z trzema sekcjami: edycja profilu, zmiana hasła i strefa niebezpieczna (usunięcie konta).

Kluczowe zasady bezpieczeństwa w tym sprincie:

- Zmiana hasła wymaga potwierdzenia **aktualnego** hasła
- Usunięcie konta wymaga wpisania **hasła** jako potwierdzenia zamiaru
- Email jest weryfikowany pod kątem dostępności zanim zostanie zmieniony

**Na koniec Sprint 4 Phase 2 powinieneś mieć**:

- ✅ Backend: `PATCH /api/auth/account` — zmiana emaila, hasła, nazwy
- ✅ Backend: `DELETE /api/auth/account` — usunięcie konta z potwierdzeniem hasłem
- ✅ Frontend: zaktualizowane typy i authStore (nowa akcja `updateUserData`)
- ✅ Frontend: `authService.ts` — funkcje `updateAccount` i `deleteAccount`
- ✅ Frontend: `UserAccountPage.tsx` — strona ustawień z trzema sekcjami
- ✅ Opcjonalnie: reset hasła przez email

---

## 🧱 Nowe technologie w tym sprincie

### "Destructive action" pattern — potwierdzenie przed trwałą operacją

Usunięcie konta jest **nieodwracalne**. Dobra praktyka UX i bezpieczeństwa to żądanie potwierdzenia przez wpisanie hasła (nie tylko kliknięcie „OK"). Nawet jeśli atakujący przejmie sesję (skradnie token JWT), nie może usunąć konta bez znajomości hasła.

**Wzorzec**:

1. Użytkownik klika „Usuń konto"
2. Pojawia się modal (`alert-dialog`) z polem do wpisania hasła
3. Po wpisaniu i zatwierdzeniu: `POST /api/auth/account/delete` z `{ password }`
4. Backend weryfikuje hasło przez `bcrypt.compare`
5. Jeśli OK: usuwa konto (CASCADE usuwa chaty i wiadomości)
6. Frontend wywołuje `setAuthLogout()` i przekierowuje na `/register.html`

---

### `alert-dialog` — modal potwierdzenia (Shadcn/ui)

`AlertDialog` to komponent Shadcn/ui zaprojektowany specjalnie do **destruktywnych akcji**. Nie da się go zamknąć kliknięciem poza nim (w przeciwieństwie do zwykłego `Dialog`) — user musi świadomie kliknąć „Anuluj" lub „Potwierdź".

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Usuń konto</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
      <AlertDialogDescription>
        Ta operacja jest nieodwracalna.
      </AlertDialogDescription>
    </AlertDialogHeader>
    {/* Tutaj pole na hasło */}
    <AlertDialogFooter>
      <AlertDialogCancel>Anuluj</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Usuń konto</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🎯 [x] Task 4.1: Pole `name` w modelu `User` ✅ Zrobione w Sprint 1

Pole `name` zostało dodane do schematu Prisma już podczas Sprint 1 Phase 2. Model `User` wygląda następująco:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String   @default("") // dodane w Sprint 1
  passwordHash String
  createdAt    DateTime @default(now())
  chats        Chat[]
}
```

Baza danych już zawiera kolumnę `name`. W tym sprincie tylko odczytujemy i aktualizujemy to pole — żadna migracja nie jest potrzebna.

---

## 🎯 [ ] Task 4.2: Backend — endpointy zarządzania kontem (1h)

### Cel

Dodanie dwóch nowych endpointów do `backend/src/routes/auth.ts`:

- `PATCH /api/auth/account` — aktualizacja emaila, hasła, nazwy
- `DELETE /api/auth/account` — usunięcie konta z weryfikacją hasła

Oba wymagają zalogowania (`authMiddleware` już jest w `index.ts` dla `/api/auth`? Sprawdź — może nie. Lepiej dodać go wewnątrz handlera przez `req.user`).

> ⚠️ **Uwaga**: endpoint `/api/auth/register` i `/api/auth/login` są publiczne — nie mogą mieć globalnego `authMiddleware`. Chronimy tylko nowe endpointy przez sprawdzenie `req.user`.

### Podpięcie `authMiddleware` tylko dla nowych endpointów w `backend/src/index.ts`

```typescript
import { authMiddleware } from "./middleware/auth.js";

// Publiczne (bez auth):
app.use("/api/auth", authRouter);

// Chronione endpointy konta (dodaj osobno):
app.use("/api/auth/account", authMiddleware, authRouter);
```

> ℹ️ Alternatywnie możesz dodać `authMiddleware` bezpośrednio w routerze dla konkretnych endpointów — patrz kod poniżej.

---

### Dodaj do `backend/src/routes/auth.ts`

Dopisz poniższe endpointy na końcu pliku:

```typescript
import { authMiddleware } from "../middleware/auth.js";

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/account — aktualizacja danych konta
// ─────────────────────────────────────────────────────────────
authRouter.patch(
  "/account",
  authMiddleware, // tylko zalogowani
  async (req: Request, res: Response) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const userId = req.user!.userId;

      // Pobierz aktualny rekord usera
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "Użytkownik nie istnieje." });
      }

      // Przygotuj obiekt z polami do aktualizacji
      const updateData: {
        name?: string;
        email?: string;
        passwordHash?: string;
      } = {};

      // 1. Aktualizacja nazwy
      if (name !== undefined) {
        if (name.trim().length === 0) {
          return res.status(400).json({ error: "Nazwa nie może być pusta." });
        }
        updateData.name = name.trim();
      }

      // 2. Aktualizacja emaila
      if (email && email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return res.status(409).json({ error: "Ten email jest już zajęty." });
        }
        updateData.email = email;
      }

      // 3. Zmiana hasła — wymaga potwierdzenia aktualnym hasłem
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ error: "Podaj aktualne hasło, aby ustawić nowe." });
        }
        const isValid = await bcrypt.compare(
          currentPassword,
          user.passwordHash,
        );
        if (!isValid) {
          return res
            .status(401)
            .json({ error: "Aktualne hasło jest nieprawidłowe." });
        }
        if (newPassword.length < 8) {
          return res
            .status(400)
            .json({ error: "Nowe hasło musi mieć co najmniej 8 znaków." });
        }
        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      // Jeśli nie ma nic do zaktualizowania — zwróć błąd
      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "Brak danych do zaktualizowania." });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, name: true }, // NIE zwracamy passwordHash!
      });

      return res.json({ user: updated });
    } catch (error) {
      console.error("[auth/account PATCH]", error);
      return res.status(500).json({ error: "Błąd serwera." });
    }
  },
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/account — usunięcie konta (wymaga hasła)
// ─────────────────────────────────────────────────────────────
authRouter.delete(
  "/account",
  authMiddleware, // tylko zalogowani
  async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const userId = req.user!.userId;

      if (!password) {
        return res
          .status(400)
          .json({ error: "Hasło jest wymagane do usunięcia konta." });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "Użytkownik nie istnieje." });
      }

      // Weryfikuj hasło — security gate przed destruktywną operacją
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Nieprawidłowe hasło." });
      }

      // onDelete: Cascade w schema.prisma automatycznie usuwa Chat[] i Message[]
      await prisma.user.delete({ where: { id: userId } });

      return res.status(204).send(); // 204 No Content — sukces, brak ciała
    } catch (error) {
      console.error("[auth/account DELETE]", error);
      return res.status(500).json({ error: "Błąd serwera." });
    }
  },
);
```

**Wyjaśnienie `select` w odpowiedzi PATCH:**

```typescript
select: { id: true, email: true, name: true }
```

`select` w Prismie to whitelist zwracanych pól. Bez niego Prisma domyślnie zwróciłaby cały obiekt — razem z `passwordHash`. **Nigdy** nie wysyłaj hasha hasła do frontendu.

---

### Sprawdzenie

- [ ] `PATCH /api/auth/account` dodany z `authMiddleware`
- [ ] `DELETE /api/auth/account` dodany z `authMiddleware`
- [ ] Test PATCH (zmiana nazwy):

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"fotaitest"}' | jq -r '.token')

curl -X PATCH http://localhost:3001/api/auth/account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jan Fotograf"}'
# Oczekiwane: { "user": { "id": "...", "email": "...", "name": "Jan Fotograf" } }
```

---

## 🎯 [ ] Task 4.3: Frontend typy — aktualizacja (0.25h)

### Cel

Aktualizacja `frontend/src/types/auth.ts` — dodanie `name` do odpowiedzi serwera, dodanie `updateUserData` do `AuthState`.

### Zaktualizuj `frontend/src/types/auth.ts`

`AuthUser` już ma pole `name` — sprawdź, czy jest. Dodaj nową akcję do `AuthState`:

```typescript
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuthLogin: (user: AuthUser, token: string) => void;
  setAuthLogout: () => void;
  updateUserData: (user: AuthUser) => void; // ← NOWE: aktualizacja danych po PATCH
}
```

**Dlaczego `updateUserData` w store, a nie tylko w komponencie?**

Po zmianie emaila lub nazwy wyświetlanej w `UserAccountPage`, informacja musi dotrzeć do `Header.tsx` (który pokazuje email/nazwę usera). Zustand to globalny store — wystarczy jedna akcja, żeby zaktualizować UI wszędzie.

---

### Sprawdzenie

- [ ] `updateUserData` dodane do `AuthState`
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 4.4: Frontend — authService (0.25h)

### Cel

Dodanie do `frontend/src/services/authService.ts` dwóch funkcji do zarządzania kontem.

### Dodaj do `frontend/src/services/authService.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Zaktualizuj dane konta (email, hasło, nazwa)
export async function updateAccount(params: {
  token: string;
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ user: { id: string; email: string; name: string } }> {
  const { token, ...body } = params;
  const response = await fetch(`${API_URL}/api/auth/account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Błąd aktualizacji konta.");
  return data;
}

// Usuń konto (wymaga hasła)
export async function deleteAccount(
  token: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ error: "Nieznany błąd" }));
    throw new Error(data.error || "Błąd usuwania konta.");
  }
  // 204 No Content — brak ciała odpowiedzi
}
```

---

### Sprawdzenie

- [ ] `updateAccount` i `deleteAccount` eksportowane z `authService.ts`
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 4.5: Frontend — authStore (0.25h)

### Cel

Dodanie akcji `updateUserData` do `authStore.ts`.

### Zaktualizuj `frontend/src/store/authStore.ts`

Dodaj nową akcję do store:

```typescript
setAuthLogin: (user, token) => {
  set({ user, token, isAuthenticated: true });
  import("./chatStore").then(({ useChatStore }) => {
    useChatStore.getState().fetchChats();
  });
},
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
updateUserData: (user) => set({ user }), // ← NOWE: aktualizacja danych usera
```

---

### Sprawdzenie

- [ ] `updateUserData` w store aktualizuje `user` w state
- [ ] Brak błędów TypeScript

---

## 🎯 [ ] Task 4.6: Frontend — UserAccountPage (1.5h)

### Cel

Budowa strony ustawień konta `/account.html`. Trzy sekcje: profil (email, nazwa), zmiana hasła, strefa niebezpieczna (usunięcie konta).

### Zastąp `frontend/src/pages/UserAccountPage.tsx`

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { updateAccount, deleteAccount } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── Schematy walidacji Zod ────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Nazwa nie może być pusta").max(50),
  email: z.string().email("Podaj prawidłowy adres email"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Podaj aktualne hasło"),
    newPassword: z.string().min(8, "Nowe hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Komponent ────────────────────────────────────────────────────────────────

export function UserAccountPage() {
  const navigate = useNavigate();
  const { user, token, updateUserData, setAuthLogout } = useAuthStore();

  // Stan dla modalu usuwania konta
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Formularz profilu ─────────────────────────────────────────────────────

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const result = await updateAccount({
        token: token!,
        name: data.name,
        email: data.email !== user?.email ? data.email : undefined,
      });
      updateUserData({ ...user!, ...result.user });
      profileForm.reset({ name: result.user.name, email: result.user.email });
    } catch (error) {
      profileForm.setError("root", {
        message: error instanceof Error ? error.message : "Błąd aktualizacji.",
      });
    }
  };

  // ── Formularz hasła ───────────────────────────────────────────────────────

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await updateAccount({
        token: token!,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
    } catch (error) {
      passwordForm.setError("root", {
        message: error instanceof Error ? error.message : "Błąd zmiany hasła.",
      });
    }
  };

  // ── Usunięcie konta ───────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteAccount(token!, deletePassword);
      setAuthLogout();
      navigate("/register.html");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Błąd usuwania konta.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Ustawienia konta</h1>

      {/* ── Sekcja: Profil ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-white">Profil</h2>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          {profileForm.formState.errors.root && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {profileForm.formState.errors.root.message}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">
              Nazwa wyświetlana
            </label>
            <Input {...profileForm.register("name")} placeholder="Jan Fotograf" />
            {profileForm.formState.errors.name && (
              <p className="text-xs text-red-400">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Email</label>
            <Input
              type="email"
              {...profileForm.register("email")}
              placeholder="jan@example.com"
            />
            {profileForm.formState.errors.email && (
              <p className="text-xs text-red-400">
                {profileForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="w-full"
          >
            {profileForm.formState.isSubmitting
              ? "Zapisywanie..."
              : "Zapisz zmiany"}
          </Button>
        </form>
      </section>

      {/* ── Sekcja: Hasło ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-white">Zmiana hasła</h2>

        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          {passwordForm.formState.errors.root && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {passwordForm.formState.errors.root.message}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">
              Aktualne hasło
            </label>
            <Input
              type="password"
              {...passwordForm.register("currentPassword")}
              placeholder="••••••••"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-red-400">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">
              Nowe hasło
            </label>
            <Input
              type="password"
              {...passwordForm.register("newPassword")}
              placeholder="min. 8 znaków"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-red-400">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">
              Potwierdź nowe hasło
            </label>
            <Input
              type="password"
              {...passwordForm.register("confirmPassword")}
              placeholder="••••••••"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="w-full"
          >
            {passwordForm.formState.isSubmitting
              ? "Zmieniam hasło..."
              : "Zmień hasło"}
          </Button>
        </form>
      </section>

      {/* ── Sekcja: Strefa niebezpieczna ────────────────────────────────── */}
      <section className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
        <h2 className="mb-2 text-xl font-semibold text-red-400">
          Strefa niebezpieczna
        </h2>
        <p className="mb-4 text-sm text-white/50">
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje chaty i wiadomości
          zostaną trwale usunięte.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Usuń konto</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription>
                Wpisz swoje hasło, aby potwierdzić. Tej operacji nie można
                cofnąć — wszystkie dane zostaną trwale usunięte.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Twoje hasło"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
              />
              {deleteError && (
                <p className="text-sm text-red-500">{deleteError}</p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletePassword("")}>
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting || deletePassword.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Usuwam..." : "Usuń konto"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
```

---

### Sprawdzenie

- [ ] `UserAccountPage.tsx` zawiera 3 sekcje: profil, hasło, strefa niebezpieczna
- [ ] Formularz profilu: walidacja Zod, błędy z serwera wyświetlają się
- [ ] Formularz hasła: walidacja potwierdzenia, błąd "złe hasło" z serwera
- [ ] Modal usuwania konta: wymaga wpisania hasła, przycisk zablokowany gdy puste
- [ ] Po usunięciu: wylogowanie i przekierowanie na `/register.html`

---

## 🎯 [ ] Task 4.7: Routing — /account.html (0.25h)

### Cel

Dodanie trasy `/account.html` w routerze i upewnienie się, że strona jest chroniona (tylko zalogowani).

### Zaktualizuj `frontend/src/index.tsx`

Dodaj import i trasę:

```typescript
import { UserAccountPage } from "./pages/UserAccountPage.tsx";

// W definicji routera, w chronionym obszarze (po weryfikacji auth):
{
  element: <UserAccountPage />,
  path: "account.html",
},
```

Jeśli trasa nie jest jeszcze chroniona przez `authMiddleware` lub przekierowanie, dodaj sprawdzenie w komponencie lub w `Layout.tsx`.

---

### Sprawdzenie

- [ ] `/account.html` renderuje `UserAccountPage`
- [ ] Niezalogowany użytkownik przekierowany na `/login.html`
- [ ] Link do konta widoczny w `Header.tsx` (lub dodaj)

---

## 🎯 [ ] Task 4.8: (Opcjonalne) Reset hasła przez email (1–2h)

### Kiedy warto to zaimplementować?

Reset hasła wymaga zewnętrznej usługi email (np. [Resend](https://resend.com/) — darmowy plan 3000 maili/mies.). Bez emaila nie da się zweryfikować, że to właściciel konta.

### Schemat przepływu

```
User klika "Nie pamiętam hasła" → wpisuje email
        ↓
Backend: generateuje token (np. crypto.randomBytes(32).toString('hex'))
Backend: zapisuje token i datę wygaśnięcia w bazie (30 min)
Backend: wysyła email z linkiem: /reset-password.html?token=...
        ↓
User klika link → strona reset-password.html
User wpisuje nowe hasło
        ↓
Backend: weryfikuje token (istnieje? nie wygasł?)
Backend: zmienia hasło, usuwa token z bazy
```

### Zmiany w schemacie Prisma (jeśli implementujesz)

```prisma
model User {
  // ... istniejące pola ...
  passwordResetToken   String?
  passwordResetExpires DateTime?
}
```

### Pakiety do zainstalowania

```bash
cd backend
npm install resend  # lub nodemailer + SMTP
```

> ℹ️ Ten task jest opcjonalny. Możesz go pominąć i wrócić do niego w Phase 7 (Quality). Dla MVP wystarczy "skontaktuj się z administratorem" jeśli zapomnisz hasła.

---

## ✅ Checklist Sprint 4 Phase 2 — Finał

### Backend

- [x] Pole `name` w modelu `User` — migracja wykonana w Sprint 1
- [ ] `PATCH /api/auth/account` — zmienia email, hasło, nazwę (z weryfikacją)
- [ ] `DELETE /api/auth/account` — usuwa konto po weryfikacji hasłem
- [ ] Żaden z endpointów nie zwraca `passwordHash`

### Frontend

- [ ] `AuthState` — akcja `updateUserData` dodana
- [ ] `authService.ts` — `updateAccount`, `deleteAccount` eksportowane
- [ ] `authStore.ts` — `updateUserData` działa (aktualizuje UI globalnie)
- [ ] `UserAccountPage.tsx` — 3 sekcje, walidacja Zod, błędy z serwera
- [ ] Trasa `/account.html` dodana w routerze

### Testy manualne

- [ ] Zmień nazwę wyświetlaną — aktualizuje się w Headerze
- [ ] Zmień email — nowy email działa przy kolejnym logowaniu
- [ ] Zmień hasło — stare hasło przestaje działać
- [ ] Spróbuj zmienić hasło ze złym "aktualnym hasłem" → komunikat błędu
- [ ] Spróbuj zarejestrować się z zajętym emailem → komunikat "Ten email jest już zajęty"
- [ ] Usuń konto ze złym hasłem → komunikat błędu
- [ ] Usuń konto z poprawnym hasłem → wylogowanie, przekierowanie, konto znikło z Prisma Studio

---

## 🚀 Co dalej? Phase 3 — Migracja

Phase 3 to etap techniczny bez nowych funkcji dla użytkownika:

- **React + Vite → Next.js App Router** — SSR, `next/image`, lepszy SEO
- **GitHub Actions CI/CD** — automatyczne testy i deployment na każdym PR
- **Playwright E2E tests** — pokrycie krytycznych przepływów testami
- **Opcjonalnie: MySQL → Supabase PostgreSQL** — jeśli planujesz używać Supabase Storage w Phase 4
