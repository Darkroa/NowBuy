import { useRoute, useLocation } from "wouter";
import { useGetProduct, useAddCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShoppingBag, Sparkles, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const id = Number(params?.id);
  const { data: product, isLoading } = useGetProduct(id);
  
  const addCartItem = useAddCartItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Added to cart", description: `${product?.name} was added to your cart.` });
      }
    }
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
          <Skeleton className="aspect-square rounded-3xl" />
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

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <Link href="/products">
        <Button variant="ghost" className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div className="rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm aspect-square flex items-center justify-center p-8">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          ) : (
            <Package className="h-32 w-32 text-muted" />
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
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">{product.name}</h1>
          <p className="text-sm text-muted-foreground mb-6">By <span className="font-medium text-foreground">{product.sellerName}</span></p>
          
          <div className="text-3xl font-semibold mb-8">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
          </div>
          
          <div className="prose prose-sm md:prose-base text-muted-foreground mb-10">
            <p>{product.description}</p>
          </div>
          
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
                {product.tags.map(tag => (
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
