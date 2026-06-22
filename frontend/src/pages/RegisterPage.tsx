import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userRegister } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { registerSchema, type RegisterForm } from "@/types/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTurnstile } from "react-turnstile";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthLogin } = useAuthStore();
  const turnstile = useTurnstile();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      turnstileToken: "", // inicjujemy pustym stringiem
    },
  });

  const turnstileToken = watch("turnstileToken");

  const onSubmit = async (data: RegisterForm) => {
    // tworzymy registerPayload aby nie przekazywać do backendu passwordConfirm
    const registerPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
      turnstileToken: data.turnstileToken,
    };
    try {
      const response = await userRegister(registerPayload);
      if ("user" in response && "token" in response) {
        setAuthLogin(response.user, response.token);

        // przekierowujemy użytkownika na stronę główną
        navigate("/");
      } else {
        setError("root", {
          message: "Błąd rejestracji",
        });
      }
    } catch (error) {
      // jeśli backend zwróci błąd, pokażemy go pod formularzem
      setError("root", {
        message: error instanceof Error ? error.message : "Błąd rejestracji",
      });

      // wymuszenie nowego Turnstile, wyczyszczenie tokenu w stanie formularza
      turnstile.reset();
      setValue("turnstileToken", "", { shouldValidate: true });
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center -mt-48">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
          <h2 className="material-title text-3xl leading-15 font-semibold">
            Zarejestruj się
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* błąd ogólny z serwera */}
            {errors.root && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {errors.root.message}
              </div>
            )}

            {/* pole imię */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-black">Imię</label>
              <Input
                type="text"
                placeholder="wpisz swoje imię"
                className="text-gray-900"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* pole email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-black">Email</label>
              <Input
                type="email"
                placeholder="wpisz swój email"
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
                placeholder="minimum 8 znaków"
                className="text-gray-900"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* pole potwierdzenie hasła */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-black">
                Potwierdź hasło
              </label>
              <Input
                type="password"
                placeholder="wpisz hasło ponownie"
                className="text-gray-900"
                {...register("passwordConfirm")}
              />
              {errors.passwordConfirm && (
                <p className="text-xs text-red-500">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            {/* validacja Turnstile */}
            <div className="space-y-1"></div>

            {/* przycisk */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Zakładanie konta..." : "Zarejestruj się"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Masz już konto?{" "}
            <Link to="/login.html" className="text-blue-600 hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
