import { Router, type IRouter, type Request, type Response } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { placeOrderForSession } from "./orders";
import { serializeOrder } from "../lib/serializers";
import crypto from "crypto";

const router: IRouter = Router();

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackPost(path: string, body: object) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ status: boolean; data: Record<string, unknown>; message: string }>;
}

async function paystackGet(path: string) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    headers: { Authorization: `Bearer ${SECRET_KEY}` },
  });
  return res.json() as Promise<{ status: boolean; data: Record<string, unknown>; message: string }>;
}

router.post("/paystack/initialize", async (req: Request, res: Response) => {
  const { email, amount, currency } = req.body as {
    email: string;
    amount: number;
    currency: string;
  };

  if (!email || !amount) {
    res.status(400).json({ error: "email and amount required" });
    return;
  }

  const amountInKobo = Math.round(amount * 100);
  const paystackCurrency = currency === "USD" ? "USD" : "NGN";

  const result = await paystackPost("/transaction/initialize", {
    email,
    amount: amountInKobo,
    currency: paystackCurrency,
    metadata: { sessionId: req.sessionId },
  });

  if (!result.status) {
    res.status(502).json({ error: result.message });
    return;
  }

  res.json({
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference: result.data.reference,
  });
});

router.post("/paystack/verify", async (req: Request, res: Response) => {
  const { reference, shippingAddress } = req.body as {
    reference: string;
    shippingAddress: string;
  };

  if (!reference || !shippingAddress) {
    res.status(400).json({ error: "reference and shippingAddress required" });
    return;
  }

  const result = await paystackGet(`/transaction/verify/${reference}`);

  if (!result.status || result.data.status !== "success") {
    res.status(402).json({ error: "Payment not confirmed", detail: result.data.status });
    return;
  }

  const placed = await placeOrderForSession(req.sessionId, shippingAddress, "user");
  if ("error" in placed) {
    res.status(400).json({ error: placed.error });
    return;
  }

  res.status(201).json(serializeOrder(placed.order));
});

router.post("/paystack/webhook", async (req: Request, res: Response) => {
  const hash = crypto
    .createHmac("sha512", SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    res.status(401).end();
    return;
  }

  res.status(200).end();
});

router.get("/settings/bank", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "bank_details"));

  const defaultDetails = {
    bankName: "",
    accountName: "",
    accountNumber: "",
  };

  if (rows.length === 0) {
    res.json(defaultDetails);
    return;
  }

  try {
    res.json(JSON.parse(rows[0]!.value));
  } catch {
    res.json(defaultDetails);
  }
});

router.put("/settings/bank", async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { role: string } }).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { bankName, accountName, accountNumber } = req.body as {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };

  if (!bankName || !accountName || !accountNumber) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  const value = JSON.stringify({ bankName, accountName, accountNumber });

  await db
    .insert(settingsTable)
    .values({ key: "bank_details", value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });

  res.json({ bankName, accountName, accountNumber });
});

export default router;
