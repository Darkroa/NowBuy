import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  usePlaceOrder,
  useGetCurrentUser,
  getGetCartQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Building2,
  Wallet,
  CreditCard,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "nb_checkout_address";
const CONTACT_KEY = "nb_checkout_contact";
const CASHBACK_KEY = "nb_checkout_cashback";

type Method = "paystack" | "stripe" | "transfer" | "delivery";

const METHODS: { id: Method; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "paystack", label: "Pay with Paystack", icon: <CreditCard className="h-4 w-4" />, hint: "Card, bank transfer, USSD & mobile money via Paystack" },
  { id: "stripe", label: "Pay with Stripe", icon: <CreditCard className="h-4 w-4" />, hint: "Card payment via Stripe — Visa, Mastercard & more" },
  { id: "transfer", label: "Manual bank transfer", icon: <Building2 className="h-4 w-4" />, hint: "Transfer to our account and confirm below" },
  { id: "delivery", label: "Pay on delivery", icon: <Wallet className="h-4 w-4" />, hint: "Cash or card when your order arrives" },
];

type BankDetails = { bankName: string; accountName: string; accountNumber: string; bankLogo?: string };
type Contact = { name: string; email: string; phone: string };
type CashbackState = { code: string; amount: number } | null;

export default function Payment() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cart, isLoading } = useGetCart();
  const { data: authData } = useGetCurrentUser();
  const [method, setMethod] = useState<Method>("paystack");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [paystackRef, setPaystackRef] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [reference] = useState(
    () => "NB" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  );

  const address =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) ?? "" : "";

  const contact: Contact = (() => {
    try { return JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "null") ?? { name: "", email: "", phone: "" }; }
    catch { return { name: "", email: "", phone: "" }; }
  })();

  const cashback: CashbackState = (() => {
    try { return JSON.parse(localStorage.getItem(CASHBACK_KEY) ?? "null"); }
    catch { return null; }
  })();

  useEffect(() => {
    if (!address) setLocation("/checkout");
  }, [address, setLocation]);

  useEffect(() => {
    if (!isLoading && cart && cart.items.length === 0) setLocation("/cart");
  }, [isLoading, cart, setLocation]);

  useEffect(() => {
    fetch("/api/settings/bank")
      .then((r) => r.json())
      .then((d) => setBankDetails(d as BankDetails))
      .catch(() => {});
  }, []);

  const placeOrder = usePlaceOrder({
    mutation: {
      onSuccess: (order) => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CASHBACK_KEY);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order placed!", description: "Your order is on the way." });
        setLocation(`/orders/${order.id}`);
      },
      onError: () => {
        toast({ title: "Couldn't place your order", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const fmt = useCallback(
    (n: number) =>
      cart
        ? new Intl.NumberFormat("en-NG", { style: "currency", currency: cart.currency }).format(n)
        : "",
    [cart],
  );

  function confirmDeliveryOrTransfer() {
    placeOrder.mutate({
      data: {
        shippingAddress: address,
        placedBy: "user",
        receiverName: contact.name || undefined,
        receiverEmail: contact.email || undefined,
        receiverPhone: contact.phone || undefined,
        cashbackCode: cashback?.code || undefined,
      } as Parameters<typeof placeOrder.mutate>[0]["data"],
    });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() =>
      toast({ title: "Copied", description: `${label} copied to clipboard.` }),
    );
  }

  function getCallbackUrl() {
    return `${window.location.origin}/payment/callback`;
  }

  async function openPaystackCheckout() {
    if (!cart) return;
    setProviderLoading(true);
    const email = authData?.user?.email ?? contact.email ?? "guest@nowbuy.app";

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: cart.subtotal,
          currency: cart.currency,
          callbackUrl: getCallbackUrl(),
        }),
      });
      const data = await res.json() as { authorizationUrl?: string; reference?: string; error?: string };

      if (!data.authorizationUrl || !data.reference) {
        toast({ title: "Paystack error", description: data.error ?? "Could not initialize payment", variant: "destructive" });
        return;
      }

      setPaystackRef(data.reference);
      window.open(data.authorizationUrl, "_blank", "noopener");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setProviderLoading(false);
    }
  }

  async function openStripeCheckout() {
    if (!cart) return;
    setProviderLoading(true);
    const email = authData?.user?.email ?? contact.email ?? "guest@nowbuy.app";

    try {
      const res = await fetch("/api/stripe/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: cart.subtotal,
          callbackUrl: getCallbackUrl(),
        }),
      });
      const data = await res.json() as { checkoutUrl?: string; sessionId?: string; error?: string };

      if (!data.checkoutUrl) {
        toast({ title: "Stripe error", description: data.error ?? "Could not initialize payment", variant: "destructive" });
        return;
      }

      window.open(data.checkoutUrl, "_blank", "noopener");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setProviderLoading(false);
    }
  }

  async function verifyPaystackPayment() {
    if (!paystackRef) return;
    setVerifying(true);
    try {
      const verifyRes = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paystackRef, shippingAddress: address,
          receiverName: contact.name || undefined,
          receiverEmail: contact.email || undefined,
          receiverPhone: contact.phone || undefined,
          cashbackCode: cashback?.code || undefined,
          cashbackDiscount: cashback?.amount || undefined,
        }),
      });
      const order = await verifyRes.json() as { id?: number; error?: string };
      if (!verifyRes.ok || order.error) {
        toast({ title: "Payment not confirmed", description: order.error ?? "Complete the checkout tab first, then try again.", variant: "destructive" });
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CASHBACK_KEY);
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast({ title: "Payment confirmed!", description: "Your order is on the way." });
      setLocation(`/orders/${order.id}`);
    } finally {
      setVerifying(false);
    }
  }

  if (isLoading || !cart) {
    return (
      <div className="container max-w-screen-lg mx-auto py-12 px-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const discountedSubtotal = cashback
    ? Math.max(0, cart.subtotal - cashback.amount)
    : cart.subtotal;

  return (
    <div className="container max-w-screen-lg mx-auto py-12 px-6">
      <Link href="/checkout">
        <Button variant="ghost" className="mb-6 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to shipping
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 2</span>
          <span>· Payment</span>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight">Payment</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div className="space-y-6">
          <Card className="p-6 border-border/50 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">How would you like to pay?</h2>
            <div className="grid gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMethod(m.id); setPaystackRef(null); }}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    method === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${method === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.hint}</p>
                  </div>
                  {method === m.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </Card>

          {method === "paystack" && !paystackRef && (
            <ProviderCard
              title="Pay securely with Paystack"
              description={<>Opens Paystack's checkout in a new tab. Pay <strong className="text-foreground">{fmt(discountedSubtotal)}</strong> via card, bank transfer, USSD, or mobile money.</>}
              buttonLabel={`Pay ${fmt(discountedSubtotal)} with Paystack`}
              loading={providerLoading}
              onClick={openPaystackCheckout}
            />
          )}

          {method === "paystack" && paystackRef && (
            <Card className="p-6 border-border/50 shadow-sm bg-primary/5 border-primary/20 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Paystack checkout opened
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your payment in the new tab, then click <strong>Confirm payment</strong> below.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-muted/40 rounded-md px-3 py-2">
                Ref: {paystackRef}
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button size="lg" className="gap-2 flex-1" disabled={verifying} onClick={verifyPaystackPayment}>
                  {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <><CheckCircle2 className="h-4 w-4" /> Confirm payment</>}
                </Button>
                <Button size="lg" variant="outline" className="gap-2" disabled={verifying} onClick={openPaystackCheckout}>
                  <ExternalLink className="h-4 w-4" /> Reopen tab
                </Button>
              </div>
            </Card>
          )}

          {method === "stripe" && (
            <ProviderCard
              title="Pay securely with Stripe"
              description={<>Opens Stripe's checkout in a new tab. Pay <strong className="text-foreground">{fmt(discountedSubtotal)}</strong> via Visa, Mastercard, or other cards. After payment, you'll be redirected back automatically.</>}
              buttonLabel={`Pay ${fmt(discountedSubtotal)} with Stripe`}
              loading={providerLoading}
              onClick={openStripeCheckout}
            />
          )}

          {method === "transfer" && (
            <Card className="p-6 border-border/50 shadow-sm bg-primary/5 border-primary/20">
              {/* Bank logo */}
              {bankDetails?.bankLogo && (
                <div className="flex justify-center mb-4">
                  <img
                    src={bankDetails.bankLogo}
                    alt={bankDetails.bankName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-border/40 shadow-sm"
                  />
                </div>
              )}
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Bank transfer details
              </h3>
              {bankDetails?.bankName ? (
                <dl className="space-y-3 text-sm">
                  <PayRow label="Bank" value={bankDetails.bankName} onCopy={copyToClipboard} />
                  <PayRow label="Account name" value={bankDetails.accountName} onCopy={copyToClipboard} />
                  <PayRow label="Account number" value={bankDetails.accountNumber} onCopy={copyToClipboard} />
                  <PayRow label="Amount" value={fmt(discountedSubtotal)} onCopy={copyToClipboard} />
                  <PayRow label="Reference" value={reference} onCopy={copyToClipboard} highlight />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Bank details not yet configured. Please contact the store.</p>
              )}
              {/* Caution note */}
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Always include your reference number</span>
                  Include <strong>{reference}</strong> in the transfer description so we can match your payment to this order. Transfers without a reference may cause delays.
                </div>
              </div>
            </Card>
          )}

          {method === "delivery" && (
            <Card className="p-6 border-border/50 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Our courier will collect payment on delivery. You'll be charged{" "}
                <span className="font-semibold text-foreground">{fmt(discountedSubtotal)}</span>{" "}
                when your order arrives. Click below to confirm your order.
              </p>
            </Card>
          )}

          {(method === "transfer" || method === "delivery") && (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2"
              disabled={placeOrder.isPending}
              onClick={confirmDeliveryOrTransfer}
            >
              <CheckCircle2 className="h-5 w-5" />
              {placeOrder.isPending
                ? "Placing order…"
                : method === "transfer"
                ? `I've paid · ${fmt(discountedSubtotal)}`
                : `Confirm order · ${fmt(discountedSubtotal)}`}
            </Button>
          )}
        </div>

        <Card className="p-6 border-border/50 shadow-sm sticky top-24">
          <h2 className="font-serif font-bold text-xl mb-4">Order summary</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/30">
                  {item.product.imageUrl && (
                    <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">
                  {fmt(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(cart.subtotal)}</span>
            </div>
            {cashback && (
              <div className="flex justify-between text-sm text-primary font-medium">
                <span>Cashback ({cashback.code})</span>
                <span>-{fmt(cashback.amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
              <span>Total</span>
              <span>{fmt(discountedSubtotal)}</span>
            </div>
          </div>
          {contact.name && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Receiver</p>
              <p className="text-sm font-medium">{contact.name}</p>
              {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Shipping to</p>
            <p className="text-sm whitespace-pre-line">{address}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProviderCard({
  title,
  description,
  buttonLabel,
  loading,
  onClick,
}: {
  title: string;
  description: React.ReactNode;
  buttonLabel: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Card className="p-6 border-border/50 shadow-sm bg-primary/5 border-primary/20">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" /> {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button
        size="lg"
        className="w-full h-12 text-base font-semibold gap-2"
        disabled={loading}
        onClick={onClick}
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
          : <><ExternalLink className="h-4 w-4" /> {buttonLabel}</>}
      </Button>
    </Card>
  );
}

function PayRow({
  label,
  value,
  highlight,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy: (v: string, l: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className={`font-mono ${highlight ? "font-bold text-primary" : ""}`}>{value}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onCopy(value, label)}
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </dd>
    </div>
  );
}
