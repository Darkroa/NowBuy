import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, passwordResetCodesTable } from "@workspace/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { RedeemResetCodeBody } from "@workspace/api-zod";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

const AUTH_COOKIE = "nb_user";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

const TTL_MS = 30 * 60 * 1000;

function generateCode() {
  const buf = randomBytes(6).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const padded = (buf + "ABCDEFGH").slice(0, 8);
  return `${padded.slice(0, 4)}-${padded.slice(4, 8)}`;
}

async function issueCode(userId: number, scope: "user" | "admin") {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db
    .insert(passwordResetCodesTable)
    .values({ userId, code, scope, expiresAt });
  return { code, expiresAt };
}

router.post(
  "/admin/users/:id/reset-code",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const scope: "user" | "admin" = user.role === "admin" ? "admin" : "user";
    const { code, expiresAt } = await issueCode(user.id, scope);
    res.json({
      code,
      scope,
      userEmail: user.email,
      expiresAt: expiresAt.toISOString(),
    });
  },
);

router.post(
  "/admin/self-reset-code",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const me = (req as Request & { authUser: { id: number; email: string } }).authUser;
    const { code, expiresAt } = await issueCode(me.id, "admin");
    res.json({
      code,
      scope: "admin",
      userEmail: me.email,
      expiresAt: expiresAt.toISOString(),
    });
  },
);

router.post("/auth/redeem-reset-code", async (req: Request, res: Response) => {
  const parsed = RedeemResetCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, code, newPassword } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));
  if (!user) {
    res.status(400).json({ error: "Invalid email or code" });
    return;
  }

  const [resetRow] = await db
    .select()
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.code, normalizedCode),
        eq(passwordResetCodesTable.userId, user.id),
        isNull(passwordResetCodesTable.usedAt),
        gt(passwordResetCodesTable.expiresAt, new Date()),
      ),
    );
  if (!resetRow) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  if (resetRow.scope === "admin" && user.role !== "admin") {
    res.status(400).json({ error: "Code is not valid for this account" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  await db
    .update(passwordResetCodesTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetCodesTable.id, resetRow.id));

  res.cookie(AUTH_COOKIE, String(user.id), COOKIE_OPTS);
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

export default router;
