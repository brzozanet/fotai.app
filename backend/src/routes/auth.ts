import { Router, Request, Response } from "express";
import { ErrorResponse, RegisterRequest } from "../types/auth";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

if (!JWT_SECRET) {
  throw new Error(
    "Brak wymaganych zmiennych. Uzupełnij plik .env i uruchom backend ponownie",
  );
}

if (
  !Number.isInteger(BCRYPT_ROUNDS) ||
  BCRYPT_ROUNDS < 10 ||
  BCRYPT_ROUNDS > 14
) {
  throw new Error("BCRYPT_ROUNDS musi być liczbą całkowitą w zakresie 10-14");
}

export const authRouter = Router();

// NOTE: POST /api/auth/register

authRouter.post("/register", async (request: Request, response: Response) => {
  try {
    const { email, name, password }: RegisterRequest = request.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedEmail || !normalizedName || !password) {
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

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        passwordHash: hashedPassword,
      },
    });

    // const token =

    return response.status(201).json(newUser);
  } catch (error) {
    const internalError: ErrorResponse = {
      error: "Server crashed succesfully 😵‍💫",
      details: `${error}`,
    };
    console.error(error);
    return response.status(500).json(internalError);
  }
});
