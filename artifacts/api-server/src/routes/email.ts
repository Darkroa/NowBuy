import { Router, type IRouter, type Request, type Response } from "express";
import { Resend } from "resend";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "NowBuy <onboarding@resend.dev>";

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
  const statusLabel = opts.orderStatus.charAt(0).toUpperCase() + opts.orderStatus.slice(1);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `Order ${opts.trackingCode} — ${statusLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
        <div style="border-bottom:2px solid #c2550f;padding-bottom:16px;margin-bottom:24px">
          <h1 style="color:#c2550f;margin:0;font-size:24px">NowBuy</h1>
        </div>
        <p style="color:#111;font-size:16px">Hi ${opts.name},</p>
        <p style="color:#333;font-size:15px">${msg}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #eee;border-radius:8px;overflow:hidden">
          <tr style="background:#faf7f5">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Order ref</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${opts.trackingCode}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Total</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${fmt}</td>
          </tr>
          <tr style="background:#faf7f5">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Shipping to</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee">${opts.shippingAddress}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px">Status</td>
            <td style="padding:12px 16px;text-transform:capitalize;color:#c2550f;font-weight:600">${opts.orderStatus}</td>
          </tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
          — The NowBuy Team · support@nowbuy.com
        </p>
      </div>`,
  });

  if (error) {
    logger.error({ error, to: opts.to, orderStatus: opts.orderStatus }, "Resend email failed");
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info({ id: data?.id, to: opts.to, orderStatus: opts.orderStatus }, "Order email sent");
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

router.post("/email/test", async (req: Request, res: Response) => {
  const { to } = req.body as { to?: string };
  if (!to) { res.status(400).json({ error: "to required" }); return; }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "NowBuy — Email test",
    html: "<div style='font-family:sans-serif;padding:24px'><h2 style='color:#c2550f'>NowBuy</h2><p>This is a test email. If you received this, emails are working correctly!</p></div>",
  });
  res.json({ data, error });
});

export default router;
