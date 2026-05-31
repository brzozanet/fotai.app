import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  // 1. Wyciągnij token z nagłówka Authorization
  //    Format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Brak tokenu autoryzacyjnego." });
  }

  const token = authHeader.split(" ")[1]; // ["Bearer", "eyJ..."][1]

  try {
    // 2. Zweryfikuj podpis tokenu
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // 3. Dołącz dane usera do obiektu request — będą dostępne w handlerze
    request.user = { userId: payload.userId, email: payload.email };

    // 4. Przekaż request dalej
    next();
  } catch (error) {
    // jwt.verify rzuca błąd gdy token jest nieważny lub wygasł
    return response
      .status(401)
      .json({ error: "Token jest nieważny lub wygasł." });
  }
}
