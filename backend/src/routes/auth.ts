import { Router, Request, Response } from "express";
import { ErrorResponse, RegisterRequest } from "../types/auth";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

// NOTE: POST /api/auth/register

authRouter.post("/register", async (request: Request, response: Response) => {
  try {
    const { name, email, password }: RegisterRequest = request.body;

    if (!name || !email || !password) {
      return response
        .status(400)
        .json({ error: "Wszystkie dane są wymagane" } as ErrorResponse);
    }
    if (password.length < 8) {
      return response
        .status(400)
        .json({ error: "Hasło musi mieć minimum 8 znaków" } as ErrorResponse);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return response.status(409).json({
        error: "Taki użytkownik już istnieje",
      } as ErrorResponse);
    }

    return response.status(200).json({ name, email, password, existingUser });
  } catch (error) {
    const internalError: ErrorResponse = {
      error: "Server crashed succesfully 😵‍💫",
      details: "Database is temporarily unavailable",
    };
    return response.status(500).json(internalError);
  }
});
