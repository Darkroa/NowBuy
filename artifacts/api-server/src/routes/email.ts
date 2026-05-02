import { Router, type IRouter, type Request, type Response } from "express";
import { Resend } from "resend";

const router: IRouter = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmail(opts: {
  to: string;
  name: string;
  orderStatus: string;
  trackingCode: string;
  total: number;
  currency: string;
  shippingAddress: string;
}) {
  const fmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: opts.currency }).format(opts.total);
  const statusMessages: Record<string, string> = {
    placed: "Your order has been placed and is being processed.",
    confirmed: "Your order has been confirmed and is being prepared.",
    dispatched: "Great news! Your order is on its way.",
    delivered: "Your order has been delivered. Enjoy!",
    cancelled: "Your order has been cancelled.",
  };
  const msg = statusMessages[opts.orderStatus] ?? `Your order status is now: ${opts.orderStatus}.`;

  await resend.emails.send({
    from: "NowBuy <support@nowbuy.com>",
    to: [opts.to],
    subject: `Order ${opts.trackingCode} — ${opts.orderStatus.charAt(0).toUpperCase() + opts.orderStatus.slice(1)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#c2550f">NowBuy</h2>
        <p>Hi ${opts.name},</p>
        <p>${msg}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Order ref</td><td style="padding:8px;font-weight:bold">${opts.trackingCode}</td></tr>
          <tr><td style="padding:8px;color:#666">Total</td><td style="padding:8px;font-weight:bold">${fmt}</td></tr>
          <tr><td style="padding:8px;color:#666">Shipping to</td><td style="padding:8px">${opts.shippingAddress}</td></tr>
          <tr><td style="padding:8px;color:#666">Status</td><td style="padding:8px;text-transform:capitalize">${opts.orderStatus}</td></tr>
        </table>
        <p style="color:#666;font-size:12px">— The NowBuy Team</p>
      </div>`,
  });
}

router.post("/email/order-status", async (req: Request, res: Response) => {
  const { to, name, orderStatus, trackingCode, total, currency, shippingAddress } = req.body as {
    to: string; name: string; orderStatus: string;
    trackingCode: string; total: number; currency: string; shippingAddress: string;
  };
  try {
    await sendOrderEmail({ to, name, orderStatus, trackingCode, total, currency, shippingAddress });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Email failed", detail: String(err) });
  }
});

export default router;
