import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Imię jest wymagane").trim(),
    email: z
      .string()
      .email("Podaj prawidłowy adres email")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Hasło musi zawierać minimum 8 znaków")
      .refine((value) => !/^\s/.test(value) && !/\s$/.test(value), {
        message: "Hasło nie może zaczynać ani kończyć się spacją",
      }),
    passwordConfirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
    turnstileToken: z.string().min(1),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są identyczne",
    path: ["passwordConfirm"], // przypisz błąd do pola passwordConfirm
  });

export const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email").trim().toLowerCase(),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type RegisterForm = z.infer<typeof registerSchema>;
export type LoginForm = z.infer<typeof loginSchema>;

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onReset: () => void;
}
