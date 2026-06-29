import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, type LoginForm } from "@/types/forms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { userLogin } from "@/services/authService";
import { useState } from "react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthLogin } = useAuthStore();

  const [turnstileToken, setTurnstileToken] = useState("");
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      turnstileToken: "",
      turnstileAction: "login",
    },
  });

  // handler działa wtedy, gdy Turnstile da nam token
  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setValue("turnstileToken", token, { shouldValidate: true });
  };

  // handler resetuje stan, jeśli token wygasł albo coś poszło nie tak
  const handleTurnstileReset = () => {
    setTurnstileToken("");
    setIsTurnstileVerified(false);
    setValue("turnstileToken", "", { shouldValidate: true });
  };

  const onSubmit = async (data: LoginForm) => {
    if (!turnstileToken || !isTurnstileVerified) {
      setError("turnstileToken", {
        type: "manual",
        message: "Weryfikacja jest wymagana",
      });
      return;
    }

    // tworzymy registerPayload aby przekazać do backendu Turnstile
    const registerPayload = {
      ...data,
      turnstileToken,
      turnstileAction: "login",
    };

    try {
      const response = await userLogin(registerPayload);

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
      // resetujemy stan Turnstile
      handleTurnstileReset();
    }
  };

  return (
    <>
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-xl shadow-md bg-background/70 backdrop-blur-sm">
          <h2 className="material-title text-3xl leading-15 font-semibold">
            Zaloguj się
          </h2>

          <p className="text-sm text-black my-2">
            Aby korzystać z aplikacji, musisz się zalogować.
            <br />
            Nie masz konta?{" "}
            <Link to="/register.html" className="text-blue-800 hover:underline">
              Zarejestruj się za darmo
            </Link>
          </p>

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
                placeholder="wpisz swój email"
                className="text-gray-900 bg-white"
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
                placeholder="wpisz swoje hasło"
                className="text-gray-900 bg-white"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* validacja Turnstile */}
            <div className="space-y-1">
              <TurnstileWidget
                action={"login"}
                onVerify={handleTurnstileVerify}
                onReset={handleTurnstileReset}
              />
              {/* {errors.turnstileToken && (
                <p className="text-xs text-red-500">
                  {errors.turnstileToken.message}
                </p>
              )} */}
            </div>

            {/* przycisk */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isTurnstileVerified || isSubmitting}
            >
              {isSubmitting ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>

          <p className="text-center text-sm text-black mt-4">
            Nie masz konta?{" "}
            <Link to="/register.html" className="text-blue-800 hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
