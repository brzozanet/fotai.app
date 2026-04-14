import { Router, Request, Response } from "express";
import { ErrorResponse, LoginRequest, RegisterRequest } from "../types/auth";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { request } from "node:http";

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

    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof password !== "string"
    ) {
      return response
        .status(400)
        .json({ error: "Wszystkie dane są wymagane" } as ErrorResponse);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedEmail || !normalizedName || !password.trim()) {
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
      where: { email: normalizedEmail },
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
      select: {
        id: true,
        name: true,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return response.status(201).json({ user: newUser, token });
  } catch (error) {
    const internalError: ErrorResponse = {
      error: "Server crashed succesfully 😵‍💫",
      details: `${error}`,
    };
    console.error(error);
    return response.status(500).json(internalError);
  }
});

// NOTE: POST /api/auth/login

authRouter.post("/login", async (request: Request, response: Response) => {
  try {
    const { email, password }: LoginRequest = request.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return response.status(400).json({
        error: "Wszystkie pola sa wymagane",
      } as ErrorResponse);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      return response.status(400).json({
        error: "Wszystkie pola sa wymagane",
      } as ErrorResponse);
    }

    // FIXME: W tym fragmencie masz trochę zbędnego rozgałęzienia:
    // - najpierw sprawdzasz, czy user istnieje,
    // - potem znowu robisz if z tym samym userem,
    // - trzymasz zmienną authUser, choć potrzebujesz tylko boola.
    // To można skrócić i uczynić czytelniejszym.
    // Flow jest prosty:
    // - znajdź usera,
    // - jeśli brak → 401,
    // - sprawdź hasło,
    // - jeśli błędne → 401.

    const findUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!findUser) {
      return response.status(401).json({
        error: "Niepoprawne dane logowania",
      } as ErrorResponse);
    }

    let isPasswordValid;

    if (findUser) {
      isPasswordValid = await bcrypt.compare(password, findUser.passwordHash);
      if (!isPasswordValid) {
        return response.status(401).json({
          error: "Niepoprawne dane logowania",
        } as ErrorResponse);
      }
    }

    return response.status(200).json({ findUser, isPasswordValid });
  } catch (error) {
    const internalError: ErrorResponse = {
      error: "Server crashed succesfully 😵‍💫",
      details: `${error}`,
    };
    console.error(error);
    return response.status(500).json(internalError);
  }
});
