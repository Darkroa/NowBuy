import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignUpBody, SignInBody } from "@workspace/api-zod";

const router: IRouter = Router();

const AUTH_COOKIE = "nb_user";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

function publicUser(u: { id: number; email: string; name: string; role: string }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, name, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalized));
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ email: normalized, name, passwordHash, role: "buyer" })
    .returning();

  res.cookie(AUTH_COOKIE, String(user!.id), COOKIE_OPTS);
  res.json(publicUser(user!));
});

router.post("/auth/signin", async (req: Request, res: Response) => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalized));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.cookie(AUTH_COOKIE, String(user.id), COOKIE_OPTS);
  res.json(publicUser(user));
});

router.post("/auth/signout", (req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.status(204).end();
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const raw = req.cookies?.[AUTH_COOKIE];
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) {
    res.json({ user: null });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  res.json({ user: user ? publicUser(user) : null });
});

export default router;
