import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import chalk from "chalk";
import { chatRouter } from "./routes/chat.js";
import { authRouter } from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || "3001";

// NOTE: Middleware - funkcje przetwarzające każdy request

// CORS - pozwala frontendowi łączyć się z backendem
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:3000"];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // --- DODAJ TEN FRAGMENT ---
    console.log("--------------------");
    console.log("Request Origin:", origin);
    console.log("Allowed Origins:", allowedOrigins);
    console.log("--------------------");
    // -------------------------

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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
