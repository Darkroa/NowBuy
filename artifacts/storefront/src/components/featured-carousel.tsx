import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";

export function FeaturedCarousel() {
  const { data: products } = useListProducts();
  const items = products ?? [];
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
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link href={`/products/${product.id}`} className="block w-full">
        {/* Instagram-post style: full-height portrait image with overlay */}
        <div className="grid sm:grid-cols-[5fr_4fr] min-h-[420px] sm:min-h-[500px]">
          <div className="relative overflow-hidden bg-muted/20">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-card/10" />
            {discountPct && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> -{discountPct}%
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10 gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">{product.category}</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-3">{product.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-2xl font-bold text-primary">{fmt(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-muted-foreground line-through">{fmt(product.originalPrice)}</span>
              )}
            </div>
            <Button className="w-fit gap-2 mt-1" size="lg">Shop now</Button>
          </div>
        </div>
      </Link>

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
            className="absolute right-3 sm:right-auto sm:left-[61%] top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background shadow-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-[30%] sm:left-[30%] -translate-x-1/2 flex gap-1.5">
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
