import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, MapPin, Package, User, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "nb_checkout_address";
const CONTACT_KEY = "nb_checkout_contact";
const CASHBACK_KEY = "nb_checkout_cashback";

type Contact = { name: string; email: string; phone: string };
type CashbackState = { code: string; amount: number } | null;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: cart, isLoading } = useGetCart();

  const [shippingAddress, setShippingAddress] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );
  const [contact, setContact] = useState<Contact>(() => {
    try { return JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "null") ?? { name: "", email: "", phone: "" }; }
    catch { return { name: "", email: "", phone: "" }; }
  });
  const [cashbackInput, setCashbackInput] = useState("");
  const [cashback, setCashback] = useState<CashbackState>(() => {
    try { return JSON.parse(localStorage.getItem(CASHBACK_KEY) ?? "null"); }
    catch { return null; }
  });
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!isLoading && cart && cart.items.length === 0) setLocation("/cart");
  }, [isLoading, cart, setLocation]);

  async function validateCashback() {
    if (!cashbackInput.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("/api/cashback/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cashbackInput.trim() }),
      });
      const data = await res.json() as { valid: boolean; amount?: number; code?: string; message?: string };
      if (data.valid && data.amount && data.code) {
        const cb = { code: data.code, amount: data.amount };
        setCashback(cb);
        localStorage.setItem(CASHBACK_KEY, JSON.stringify(cb));
        toast({ title: "Cashback applied!", description: data.message });
      } else {
        setCashback(null);
        localStorage.removeItem(CASHBACK_KEY);
        toast({ title: "Invalid code", description: data.message ?? "That code is not valid.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not validate code.", variant: "destructive" });
    } finally { setValidating(false); }
  }

  function removeCashback() {
    setCashback(null);
    setCashbackInput("");
    localStorage.removeItem(CASHBACK_KEY);
  }

  function continueToPayment() {
    if (shippingAddress.trim().length < 3) return;
    localStorage.setItem(STORAGE_KEY, shippingAddress.trim());
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
    setLocation("/payment");
  }

  if (isLoading || !cart) {
    return (
      <div className="container max-w-screen-lg mx-auto py-12 px-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: cart.currency }).format(n);

  const discountedSubtotal = cashback
    ? Math.max(0, cart.subtotal - cashback.amount)
    : cart.subtotal;

  const canContinue =
    shippingAddress.trim().length >= 3 &&
    contact.name.trim().length >= 2 &&
    contact.phone.trim().length >= 7;

  return (
    <div className="container max-w-screen-lg mx-auto py-12 px-6">
      <Link href="/cart">
        <Button variant="ghost" className="mb-6 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 1 of 2</span>
          <span>· Shipping & Contact</span>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div className="space-y-6">
          {/* Receiver info */}
          <Card className="p-6 border-border/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Receiver details</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rec-name">Full name *</Label>
                <Input id="rec-name" placeholder="John Doe" value={contact.name}
                  onChange={e => setContact(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-phone">Phone number *</Label>
                <Input id="rec-phone" placeholder="+234 800 000 0000" value={contact.phone}
                  onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-email">Email <span className="text-muted-foreground font-normal">(optional, for order updates)</span></Label>
              <Input id="rec-email" type="email" placeholder="john@example.com" value={contact.email}
                onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
            </div>
          </Card>

          {/* Shipping address */}
          <Card className="p-6 border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Delivery address *</h2>
            </div>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Street address, city, state, postal code…"
              className="h-28 resize-none"
            />
          </Card>

          {/* Cashback */}
          <Card className="p-6 border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Cashback code <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2>
            </div>
            {cashback ? (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">{cashback.code}</p>
                  <p className="text-xs text-muted-foreground">Saves you {fmt(cashback.amount)}</p>
                </div>
                <button onClick={removeCashback} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code e.g. SAVE500"
                  value={cashbackInput}
                  onChange={e => setCashbackInput(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button onClick={validateCashback} disabled={validating || !cashbackInput.trim()} variant="outline">
                  {validating ? "..." : "Apply"}
                </Button>
              </div>
            )}
          </Card>

          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold gap-2"
            disabled={!canContinue}
            onClick={continueToPayment}
          >
            Continue to payment <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Order summary */}
        <Card className="p-6 border-border/50 shadow-sm sticky top-24">
          <h2 className="font-serif font-bold text-xl mb-4">Order summary</h2>
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/30 flex items-center justify-center">
                  {item.product.imageUrl
                    ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                    : <Package className="h-4 w-4 text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">{fmt(item.product.price * item.quantity)}</span>
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
        </Card>
      </div>
    </div>
  );
}
