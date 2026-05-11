import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRight, Clock, MapPin, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Orders</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container max-w-screen-xl mx-auto py-24 px-6 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">No orders yet</h2>
        <p className="text-muted-foreground mb-8">
          You haven't placed any orders. Start exploring our collection to find something you love.
        </p>
        <Link href="/products">
          <Button size="lg" className="w-full sm:w-auto h-12 px-8">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Orders</h1>
      
      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-muted/30 p-5 sm:px-8 border-b border-border/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground mb-0.5">Order Placed</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Total</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: order.currency }).format(order.total)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Tracking</p>
                  <p className="font-mono text-xs mt-0.5 font-medium bg-background px-2 py-0.5 rounded border border-border/50">
                    {order.trackingCode}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`capitalize px-3 py-1 font-medium ${
                  order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                  order.status === 'dispatched' ? 'bg-violet-500/10 text-violet-700 border-violet-200' :
                  order.status === 'confirmed' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                  order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-700 border-rose-200' :
                  'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {order.status}
                </Badge>
              </div>
            </div>
            
            <div className="p-5 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex gap-3">
                {order.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="w-16 h-16 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center overflow-hidden relative group">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    ) : (
                      <Package className="h-6 w-6 text-muted" />
                    )}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0 right-0 bg-background/90 text-[10px] font-bold px-1.5 rounded-tl">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="w-16 h-16 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center text-sm font-medium text-muted-foreground">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
              
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" className="shrink-0 gap-2">
                  View Details <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
