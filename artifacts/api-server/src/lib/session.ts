import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";

const COOKIE = "nb_session";

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

export function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let sid = req.cookies?.[COOKIE];
  if (!sid || typeof sid !== "string") {
    sid = randomBytes(16).toString("hex");
    res.cookie(COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  req.sessionId = sid;
  next();
}
