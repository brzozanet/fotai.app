import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import { chatRouter } from "./routes/chat.js";
import { authRouter } from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || "3001";

// NOTE: Middleware - funkcje przetwarzające każdy request

// CORS - pozwala frontendowi łączyć się z backendem
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((request, response, next) => {
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization",
    );
    response.sendStatus(204);
    return;
  }

  next();
});

// JSON Parser - automatycznie parsuje body requestów do JSON
app.use(express.json());

// NOTE: Routes - definicje endpointów API

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

// TODO: run middleware after auth add
// app.use("/api/chat", authMiddleware, chatRouter);

app.get("/health", (request, response) => {
  response.json({
    status: "Backend server status OK 🤖",
    timestamp: new Date().toISOString(),
  });
});

// NOTE: Conditional logging - szczegółowe logi tylko w development

if (process.env.NODE_ENV === "development") {
  app.use((request, response, next) => {
    console.log(`${request.method} ${request.path}`);
    next();
  });
}

// NOTE: Start serwera

app.listen(PORT, () => {
  console.log(`
    ${chalk.red.bold("EXPRESS")} ${chalk.gray("ready server")} ${chalk.bold("backend")} 
    ${chalk.red.bold("➜")} ${chalk.bold("Local: ")} ${chalk.cyan("http://localhost:")}${chalk.cyan.bold(PORT)}${chalk.cyan("/")}
    `);
});
