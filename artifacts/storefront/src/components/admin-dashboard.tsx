import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, DollarSign, Calendar, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

type SalesSummary = {
  todayTotal: number; monthTotal: number; allTimeTotal: number;
  todayOrders: number; monthOrders: number; allTimeOrders: number;
  dailyChart: { date: string; total: number; orders: number }[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function AdminDashboard() {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sales-summary", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d as SalesSummary); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = data ? [
    { label: "Today's revenue", value: fmt(data.todayTotal), sub: `${data.todayOrders} order${data.todayOrders === 1 ? "" : "s"}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "This month", value: fmt(data.monthTotal), sub: `${data.monthOrders} orders`, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "All-time revenue", value: fmt(data.allTimeTotal), sub: `${data.allTimeOrders} total orders`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total orders", value: data.allTimeOrders.toString(), sub: "across all time", icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50" },
  ] : [];

  const chartData = data?.dailyChart.map(d => ({
    ...d,
    label: shortDate(d.date),
  })) ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-3 bg-muted rounded w-1/2 mb-3" />
              <div className="h-8 bg-muted rounded w-3/4 mb-1" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </Card>
          ))}
        </div>
        <Card className="p-6 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.label} className="p-5 border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </Card>
        ))}
      </div>

      {/* 30-day chart */}
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Last 30 days — daily revenue</h3>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v === 0 ? "0" : `₦${(v as number / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => [fmt(v), "Revenue"]}
                labelFormatter={l => `Date: ${l}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: "hsl(var(--primary))", fill: "hsl(var(--card))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
