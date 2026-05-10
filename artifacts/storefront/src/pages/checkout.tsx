import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, MapPin, Package } from "lucide-react";

const STORAGE_KEY = "nb_checkout_address";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { data: cart, isLoading } = useGetCart();
  const [shippingAddress, setShippingAddress] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  useEffect(() => {
    if (!isLoading && cart && cart.items.length === 0) {
      setLocation("/cart");
    }
  }, [isLoading, cart, setLocation]);

  function continueToPayment() {
    if (shippingAddress.trim().length < 3) return;
    localStorage.setItem(STORAGE_KEY, shippingAddress.trim());
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
          <span>· Shipping</span>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <Card className="p-8 border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-lg">Where should we ship it?</h2>
          </div>
          <Textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Full name, street, city, state, postal code, country…"
            className="h-32 resize-none"
          />
          <Button
            size="lg"
            className="w-full mt-6 h-12 text-base font-semibold gap-2"
            disabled={shippingAddress.trim().length < 3}
            onClick={continueToPayment}
          >
            Continue to payment <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="p-6 border-border/50 shadow-sm sticky top-24">
          <h2 className="font-serif font-bold text-xl mb-4">Order summary</h2>
          <div className="space-y-3 mb-4">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/30 flex items-center justify-center">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-muted" />
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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
              <span>Total</span>
              <span>{fmt(cart.subtotal)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
