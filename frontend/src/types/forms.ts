import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email").trim().toLowerCase(),
  password: z.string().min(8, "Hasło musi zawierać minimum 8 znaków").trim(),
});

export type LoginForm = z.infer<typeof loginSchema>;
