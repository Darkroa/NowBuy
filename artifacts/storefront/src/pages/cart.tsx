import { useGetCart, useRemoveCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Cart() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart();

  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Cart</h1>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
          <div className="w-full lg:w-96 shrink-0">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container max-w-screen-xl mx-auto py-24 px-6 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added anything yet. Need help finding something? Ask our AI assistant!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/products">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8">Browse Products</Button>
          </Link>
          <Link href="/assistant">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 gap-2 border-primary/20 text-primary hover:bg-primary/5">
              Ask AI <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="flex-1 w-full space-y-4">
          {cart.items.map((item) => (
            <Card key={item.productId} className="flex gap-4 p-4 border-border/50 shadow-sm overflow-hidden">
              <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-background rounded-xl flex items-center justify-center overflow-hidden border border-border/40">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                ) : (
                  <Package className="h-8 w-8 text-muted" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between py-1">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-1">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.sellerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold whitespace-nowrap">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: item.product.currency }).format(item.product.price)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium bg-muted px-3 py-1 rounded-md">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                    onClick={() => removeItem.mutate({ productId: item.productId })}
                    disabled={removeItem.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <Card className="w-full lg:w-96 shrink-0 p-6 border-border/50 shadow-sm sticky top-24">
          <h2 className="font-serif font-bold text-xl mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({cart.items.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: cart.currency }).format(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: cart.currency }).format(cart.subtotal)}</span>
            </div>
          </div>
          
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold gap-2"
            onClick={() => setLocation("/checkout")}
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
