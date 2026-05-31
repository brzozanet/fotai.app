// NOTE: Rozszerzenie typów Express — dodajemy pole `user` do Request

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
