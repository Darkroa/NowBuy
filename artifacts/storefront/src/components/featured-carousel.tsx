import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";

export function FeaturedCarousel() {
  const { data: products } = useListProducts({ limit: 8 });
  const items = products?.products ?? [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)), [items.length]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, items.length, paused]);

  if (items.length === 0) return null;

  const product = items[current]!;
  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex transition-none">
        <Link href={`/products/${product.id}`} className="block w-full">
          <div className="grid sm:grid-cols-2 min-h-[320px] sm:min-h-[380px]">
            <div className="relative overflow-hidden bg-muted/30">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ minHeight: 220 }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10 gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">{product.category}</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h3>
              <p className="text-muted-foreground text-sm line-clamp-3">{product.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-bold text-primary">{fmt(product.price)}</span>
              </div>
              <Button className="w-fit gap-2 mt-1" size="lg">Shop now</Button>
            </div>
          </div>
        </Link>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background shadow-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background shadow-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-1.5 bg-primary/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
