import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetProduct, useAddCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Star, ShoppingBag, Sparkles, Package,
  ChevronLeft, ChevronRight, Share2, Facebook, Twitter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeIdx, setActiveIdx] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const id = Number(params?.id);
  const { data: product, isLoading } = useGetProduct(id);

  const addCartItem = useAddCartItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Added to cart", description: `${product?.name} was added to your cart.` });
      },
    },
  });

  const handleBuyNow = async () => {
    if (!product) return;
    await addCartItem.mutateAsync({ data: { productId: product.id, quantity: 1 } });
    setLocation("/checkout");
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div className="space-y-3">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-16 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-6 pt-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container max-w-screen-xl mx-auto py-24 px-6 text-center">
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">Product not found</h2>
        <Link href="/products"><Button variant="outline">Back to products</Button></Link>
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency }).format(n);

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.originalPrice != null && (product.originalPrice as number) > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(product.images ?? []).filter(img => img !== product.imageUrl),
  ];
  const activeImage = allImages[activeIdx] ?? null;

  const url = `${window.location.origin}/products/${product.id}`;
  const text = `Check out ${product.name} on NowBuy!`;

  function shareOn(platform: string) {
    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: `Paste it on ${platform}!` });
    }
    setShareOpen(false);
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <Link href="/products">
        <Button variant="ghost" className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm aspect-square flex items-center justify-center p-8 group">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-200" />
            ) : (
              <Package className="h-32 w-32 text-muted" />
            )}

            {allImages.length > 1 && (
              <>
                <button type="button" onClick={() => setActiveIdx(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setActiveIdx(i => (i + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActiveIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeIdx ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button key={img} type="button" onClick={() => setActiveIdx(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx ? "border-primary shadow-md" : "border-border/40 hover:border-primary/50 opacity-70 hover:opacity-100"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col pt-6 md:pt-10">
          <div className="mb-2 flex items-center gap-3 flex-wrap">
            <Link href={`/products?category=${product.category}`}>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium cursor-pointer">
                {product.category}
              </Badge>
            </Link>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
            </div>
            {/* Share button */}
            <div className="relative ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setShareOpen(o => !o)}
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
              {shareOpen && (
                <div className="absolute right-0 top-10 z-30 bg-card border border-border/60 rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[170px]">
                  {[
                    { id: "facebook", label: "Share on Facebook", color: "text-blue-600" },
                    { id: "x", label: "Share on X / Twitter", color: "text-foreground" },
                    { id: "instagram", label: "Copy for Instagram", color: "text-pink-600" },
                    { id: "tiktok", label: "Copy for TikTok", color: "text-foreground" },
                  ].map(s => (
                    <button key={s.id} onClick={() => shareOn(s.id)}
                      className={`text-left text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors ${s.color}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-3">{product.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            By <span className="font-medium text-foreground">{product.sellerName}</span>
          </p>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-bold text-primary">{fmt(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">{fmt(product.originalPrice as number)}</span>
                <Badge className="bg-primary text-primary-foreground font-bold">-{discountPct}% off</Badge>
              </>
            )}
          </div>

          <div className="prose prose-sm md:prose-base text-muted-foreground mb-8">
            <p>{product.description}</p>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Available colours</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <Badge key={c} variant="outline" className="bg-card font-normal">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={isOutOfStock ? "text-destructive font-medium" : "text-emerald-600 font-medium"}>
                {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
              </span>
            </div>

            <div className="space-y-3">
              <Button size="lg" className="w-full h-14 text-base font-semibold gap-2"
                disabled={isOutOfStock || addCartItem.isPending} onClick={handleBuyNow}>
                <ShoppingBag className="h-5 w-5" />
                {addCartItem.isPending ? "Processing..." : "Buy now"}
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" size="lg" className="w-full h-12 text-sm font-semibold gap-2 border-border/60"
                  disabled={isOutOfStock || addCartItem.isPending}
                  onClick={() => addCartItem.mutate({ data: { productId: product.id, quantity: 1 } })}>
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </Button>
                <Button variant="outline" size="lg" className="w-full h-12 text-sm font-semibold gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => { sessionStorage.setItem("nb_prefill", `I'd like to buy the ${product.name}`); setLocation("/assistant"); }}>
                  <Sparkles className="h-4 w-4 text-primary" /> Ask AI to buy
                </Button>
              </div>
            </div>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border/50">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-card font-normal text-muted-foreground">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
