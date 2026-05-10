import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProduct, useAddCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShoppingBag, Sparkles, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeIdx, setActiveIdx] = useState(0);

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
        <Link href="/products">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  const handleAskAIToBuy = () => {
    sessionStorage.setItem("nb_prefill", `I'd like to buy the ${product.name}`);
    setLocation("/assistant");
  };

  const isOutOfStock = product.stock <= 0;

  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(product.images ?? []).filter((img) => img !== product.imageUrl),
  ];

  const activeImage = allImages[activeIdx] ?? null;

  function prevImage() {
    setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length);
  }

  function nextImage() {
    setActiveIdx((i) => (i + 1) % allImages.length);
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <Link href="/products">
        <Button variant="ghost" className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm aspect-square flex items-center justify-center p-8 group">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-200"
              />
            ) : (
              <Package className="h-32 w-32 text-muted" />
            )}

            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/50 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeIdx ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"
                      }`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeIdx
                      ? "border-primary shadow-md"
                      : "border-border/40 hover:border-primary/50 opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col pt-6 md:pt-10">
          <div className="mb-2 flex items-center gap-3">
            <Link href={`/products?category=${product.category}`}>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium cursor-pointer">
                {product.category}
              </Badge>
            </Link>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
            </div>
            {allImages.length > 1 && (
              <span className="text-xs text-muted-foreground">{allImages.length} photos</span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">{product.name}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            By <span className="font-medium text-foreground">{product.sellerName}</span>
          </p>

          <div className="text-3xl font-semibold mb-8">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency }).format(product.price)}
          </div>

          <div className="prose prose-sm md:prose-base text-muted-foreground mb-10">
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
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold gap-2"
                disabled={isOutOfStock || addCartItem.isPending}
                onClick={handleBuyNow}
              >
                <ShoppingBag className="h-5 w-5" />
                {addCartItem.isPending ? "Processing..." : "Buy now"}
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-sm font-semibold gap-2 border-border/60"
                  disabled={isOutOfStock || addCartItem.isPending}
                  onClick={() => addCartItem.mutate({ data: { productId: product.id, quantity: 1 } })}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-sm font-semibold gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={handleAskAIToBuy}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ask AI to buy
                </Button>
              </div>
            </div>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border/50">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-card font-normal text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
