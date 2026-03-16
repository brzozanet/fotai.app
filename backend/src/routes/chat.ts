import { Router, Request, Response } from "express";
import { ChatRequest, ChatResponse, ErrorResponse } from "../types/chat.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// NOTE: Konfiguracja OpenAI Client

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT;
const CURRENT_WORKSHOPS = process.env.CURRENT_WORKSHOPS;
const CURRENT_WORKSHOPS_RULES = process.env.CURRENT_WORKSHOPS_RULES;

if (
  !MODEL ||
  !OPENAI_API_KEY ||
  !SYSTEM_PROMPT ||
  !CURRENT_WORKSHOPS ||
  !CURRENT_WORKSHOPS_RULES
) {
  throw new Error(
    "Brak wymaganych zmiennych. Uzupełnij plik .env i uruchom backend ponownie.",
  );
}

const buildSystemPrompt = () => {
  return [
    SYSTEM_PROMPT.trim(),
    "<CurrentWorkshops>",
    CURRENT_WORKSHOPS.trim(),
    "</CurrentWorkshops>",
    CURRENT_WORKSHOPS_RULES.trim(),
  ].join("\n");
};

// NOTE: POST /api/chat - główny endpoint czatu

export const chatRouter = Router();

chatRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { message, previousResponseId }: ChatRequest = request.body;

    if (!message || message.trim() === "") {
      return response
        .status(400)
        .json({ error: "Message is required" } as ErrorResponse);
    }

    const chatRequest = await client.responses.create({
      model: MODEL,
      previous_response_id: previousResponseId,
      input: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const chatResponse: ChatResponse = {
      id: chatRequest.id,
      message: chatRequest.output_text,
      timestamp: new Date().toISOString(),
    };

    return response.json(chatResponse);
  } catch (error) {
    const internalError: ErrorResponse = {
      error: "Server crashed succesfully 😵‍💫",
      details: "OpenAI API is temporarily unavailable",
    };
    if (typeof error === "object" && error !== null && "status" in error) {
      // NOTE: Różne typy błędów OpenAI
      if (error.status === 401) {
        return response.status(401).json({
          error: "Invalid OpenAI API key",
          details: "Check OPENAI_API_KEY in .env",
        } as ErrorResponse);
      }
      if (error.status === 429) {
        return response.status(429).json({
          error: "Rate limit exceeded",
          details: "Too many requests. Try again later.",
        } as ErrorResponse);
      }
      return response.status(500).json(internalError);
    }
    return response.status(500).json(internalError);
  }
});
