import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm font-semibold">
              {new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency }).format(product.price)}
            </Badge>
          </div>
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="font-semibold shadow-sm">
                Only {product.stock} left
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <Badge variant="outline" className="text-[10px] font-medium tracking-wider uppercase bg-transparent border-border/50">
              {product.category}
            </Badge>
          </div>
          <h3 className="font-sans font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-amber-500 font-medium">
            <Star className="h-4 w-4 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">{product.sellerName}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
