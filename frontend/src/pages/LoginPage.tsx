import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, type LoginForm } from "@/types/forms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { userLogin } from "@/services/authService";

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
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await userLogin(data);

      // zapisujemy token i użytkownika do store
      if ("user" in response && "token" in response) {
        setAuthLogin(response.user, response.token);

        // przekierowujemy użytkownika na stronę główną
        navigate("/");
      } else {
        setError("root", {
          message: "Błąd logowania",
        });
      }
    } catch (error) {
      // jeśli backend zwróci błąd, pokażemy go pod formularzem
      setError("root", {
        message: error instanceof Error ? error.message : "Błąd logowania",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-48">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h2 className="material-title text-3xl leading-15 font-semibold">
          Zaloguj się
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* błąd ogólny z serwera */}
          {errors.root && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {errors.root.message}
            </div>
          )}

          {/* pole email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-black">Email</label>
            <Input
              type="email"
              placeholder="jan@example.com"
              className="text-gray-900"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* pole hasło */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-black">Hasło</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="text-gray-900"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* przycisk */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nie masz konta?{" "}
          <Link to="/register.html" className="text-blue-600 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
