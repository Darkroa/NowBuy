import { Router, type IRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { placeOrderForSession, sendPlacedEmailAndNotification } from "./orders";
import { serializeOrder } from "../lib/serializers";
import { getUserFromCookie } from "../lib/auth";

const router: IRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "no-key-set");

router.post("/stripe/initialize", async (req: Request, res: Response) => {
  const { email, amount, callbackUrl } = req.body as {
    email: string;
    amount: number;
    callbackUrl: string;
  };

  if (!email || !amount || !callbackUrl) {
    res.status(400).json({ error: "email, amount and callbackUrl required" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe is not configured on this server" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "ngn",
            product_data: { name: "NowBuy Order" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${callbackUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${callbackUrl}?cancelled=1`,
      metadata: { sessionId: req.sessionId },
    });

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    res.status(502).json({ error: "Failed to create Stripe session", detail: String(err) });
  }
});

router.post("/stripe/verify", async (req: Request, res: Response) => {
  const { sessionId, shippingAddress } = req.body as {
    sessionId: string;
    shippingAddress: string;
  };

  if (!sessionId || !shippingAddress) {
    res.status(400).json({ error: "sessionId and shippingAddress required" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed", detail: session.payment_status });
      return;
    }

    const user = await getUserFromCookie(req);
    const placed = await placeOrderForSession(req.sessionId, shippingAddress, "user", user?.id);
    if ("error" in placed) {
      res.status(400).json({ error: placed.error });
      return;
    }

    if (user?.id) {
      try { await sendPlacedEmailAndNotification(placed.order, user.id); } catch (err) { req.log.error({ err }, "stripe order email failed"); }
    }

    res.status(201).json(serializeOrder(placed.order));
  } catch (err) {
    res.status(502).json({ error: "Stripe verification failed", detail: String(err) });
  }
});

export default router;
