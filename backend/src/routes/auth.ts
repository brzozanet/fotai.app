import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { Router, Request, Response } from "express";
import { AuthError, LoginRequest, RegisterRequest } from "../types/auth";
import { verifyTurnstileToken } from "../services/turnstile.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const TOKEN_EXPIRES_IN = "1d";

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
    const {
      email,
      name,
      password,
      turnstileToken,
      turnstileAction,
    }: RegisterRequest = request.body;

    const verifyTurnstileResult = await verifyTurnstileToken(
      turnstileToken,
      turnstileAction,
    );

    if (!verifyTurnstileResult.ok) {
      return response
        .status(403)
        .json({ error: "Weryfikacja Turnstile nie powiodła się" } as AuthError);
    }

    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof password !== "string"
    ) {
      return response
        .status(400)
        .json({ error: "Wszystkie dane są wymagane" } as AuthError);
    }

    if (password !== password.trim()) {
      return response.status(400).json({
        error: "Hasło nie może zaczynać się ani kończyć spacją",
      } as AuthError);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedEmail || !normalizedName || !password) {
      return response
        .status(400)
        .json({ error: "Wszystkie dane są wymagane" } as AuthError);
    }

    if (password.length < 8) {
      return response
        .status(400)
        .json({ error: "Hasło musi mieć minimum 8 znaków" } as AuthError);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return response.status(409).json({
        error: "Taki użytkownik już istnieje",
      } as AuthError);
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
        email: true,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    return response.status(201).json({ user: newUser, token });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return response.status(409).json({
        error: "Taki użytkownik już istnieje",
      } as AuthError);
    }

    const internalError: AuthError = {
      error: "Wewnętrzny błąd serwera 😵‍💫",
    };
    console.error(error);
    return response.status(500).json(internalError);
  }
});

// NOTE: POST /api/auth/login

authRouter.post("/login", async (request: Request, response: Response) => {
  try {
    const { email, password, turnstileToken, turnstileAction }: LoginRequest =
      request.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return response.status(400).json({
        error: "Wszystkie pola sa wymagane",
      } as AuthError);
    }

    if (password !== password.trim()) {
      return response.status(400).json({
        error: "Hasło nie może zaczynać się ani kończyć spacją",
      } as AuthError);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return response.status(400).json({
        error: "Wszystkie pola sa wymagane",
      } as AuthError);
    }

    const findUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!findUser) {
      return response.status(401).json({
        error: "Niepoprawne dane logowania",
      } as AuthError);
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      findUser.passwordHash,
    );

    if (!isPasswordValid) {
      return response.status(401).json({
        error: "Niepoprawne dane logowania",
      } as AuthError);
    }

    const token = jwt.sign({ userId: findUser.id }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    return response.status(200).json({
      user: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
      },
      token,
    });
  } catch (error) {
    const internalError: AuthError = {
      error: "Wewnętrzny błąd serwera 😵‍💫",
    };
    console.error(error);
    return response.status(500).json(internalError);
  }
});
