import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email").trim().toLowerCase(),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginForm = z.infer<typeof loginSchema>;
