import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginForm } from "@/types/forms";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthLogin } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      // 1. Wyślij dane do backendu
      // 2. Zapisz token i usera do store
      // 3. Przekieruj na stronę główną
    } catch (error) {
      // Pokaż błąd z serwera
    }
  };

  return (
    <>
      <h1>Zaloguj się, aby korzystać z FOTOAI</h1>
      <form>
        <input type="text" name="login" placeholder="Wpisz login" />
        <input type="text" name="password" placeholder="Wpisz hasło" />
        <button type="submit">Zaloguj się</button>
      </form>
      <p>
        Nie Masz jeszcze konta? <a href="#">Zarejestruj się</a>
      </p>
    </>
  );
}
