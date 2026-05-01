import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllOrders,
  updateOrderStatus,
  getListAllOrdersQueryKey,
  type Order,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Package, Clock, Truck, CheckCircle2 } from "lucide-react";

const STATUSES = ["placed", "processing", "shipped", "delivered"] as const;
type Status = (typeof STATUSES)[number];

const statusIcon: Record<Status, React.ReactNode> = {
  placed: <Clock className="h-3.5 w-3.5" />,
  processing: <Package className="h-3.5 w-3.5" />,
  shipped: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
};

const statusColor: Record<Status, string> = {
  placed: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function OrdersManager() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useListAllOrders();

  async function setStatus(order: Order, status: Status) {
    if (order.status === status) return;
    await updateOrderStatus(order.id, { status });
    await queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="font-serif text-xl font-bold mb-1">Orders</h3>
      <p className="text-xs text-muted-foreground mb-4">Move orders through fulfillment.</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = order.status as Status;
            return (
              <div
                key={order.id}
                className="rounded-xl border border-border/40 bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Order #{order.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[status] ?? statusColor.placed}`}
                      >
                        {statusIcon[status] ?? statusIcon.placed}
                        {status}
                      </span>
                      {order.placedBy === "ai" && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} · ${order.total.toFixed(2)} · {order.trackingCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ship to: {order.shippingAddress}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === status ? "default" : "outline"}
                        className="h-7 text-xs px-2"
                        onClick={() => setStatus(order, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2 py-1"
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                      <span className="text-xs">
                        {item.productName} × {item.quantity}
                      </span>
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
