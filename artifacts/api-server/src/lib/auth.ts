import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type Role = "buyer" | "admin" | "pm";

export async function getUserFromCookie(req: Request) {
  const raw = req.cookies?.["nb_user"];
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export function requireRole(...allowed: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserFromCookie(req);
    if (!user) {
      res.status(401).json({ error: "Sign in required" });
      return;
    }
    if (!allowed.includes(user.role as Role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as Request & { authUser: typeof user }).authUser = user;
    next();
  };
}
