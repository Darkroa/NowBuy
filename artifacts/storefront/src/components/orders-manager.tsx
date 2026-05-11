import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllOrders,
  updateOrderStatus,
  getListAllOrdersQueryKey,
  type Order,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Package, Clock, Truck, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type Status = "placed" | "confirmed" | "dispatched" | "delivered" | "cancelled";

const STATUS_FLOW: Status[] = ["placed", "confirmed", "dispatched", "delivered"];

const statusIcon: Record<Status, React.ReactNode> = {
  placed: <Clock className="h-3.5 w-3.5" />,
  confirmed: <Package className="h-3.5 w-3.5" />,
  dispatched: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
};

const statusColor: Record<Status, string> = {
  placed: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  dispatched: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel: Record<Status, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrdersManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading } = useListAllOrders();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  async function setStatus(order: Order, status: Status) {
    if (order.status === status) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, { status });
      await queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      toast({ title: `Order #${order.id} → ${statusLabel[status]}` });
    } catch {
      toast({ title: "Error updating order", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="font-serif text-xl font-bold mb-1">Orders</h3>
      <p className="text-xs text-muted-foreground mb-4">Move orders through fulfillment. Cancel if needed.</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = order.status as Status;
            const isCancelled = status === "cancelled";
            const isDelivered = status === "delivered";
            const isUpdating = updatingId === order.id;
            const receiverName = (order as typeof order & { receiverName?: string }).receiverName;
            const cashbackDiscount = (order as typeof order & { cashbackDiscount?: number }).cashbackDiscount;
            return (
              <div key={order.id} className={`rounded-xl border p-4 ${isCancelled ? "border-rose-200/60 bg-rose-50/30" : "border-border/40 bg-background"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">Order #{order.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[status] ?? statusColor.placed}`}>
                        {statusIcon[status] ?? statusIcon.placed}
                        {statusLabel[status] ?? status}
                      </span>
                      {order.placedBy === "ai" && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">AI</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      {" · "}{fmt(order.total)}
                      {cashbackDiscount ? <span className="text-primary"> (cashback -₦{cashbackDiscount.toLocaleString()})</span> : ""}
                      {" · "}{order.trackingCode}
                    </p>
                    {receiverName && (
                      <p className="text-xs text-muted-foreground">Receiver: {receiverName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Ship to: {order.shippingAddress}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("en-NG")}</p>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {/* Flow buttons */}
                    {!isCancelled && !isDelivered && (
                      <div className="flex flex-wrap gap-1">
                        {STATUS_FLOW.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={s === status ? "default" : "outline"}
                            className="h-7 text-xs px-2"
                            onClick={() => setStatus(order, s)}
                            disabled={isUpdating}
                          >
                            {statusLabel[s]}
                          </Button>
                        ))}
                      </div>
                    )}
                    {isDelivered && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                      </span>
                    )}
                    {/* Cancel / restore */}
                    {!isCancelled && !isDelivered && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => { if (confirm("Cancel this order?")) setStatus(order, "cancelled"); }}
                        disabled={isUpdating}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    )}
                    {isCancelled && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setStatus(order, "placed")}
                        disabled={isUpdating}
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Restore
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2 py-1">
                      <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      <span className="text-xs">{item.productName} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
