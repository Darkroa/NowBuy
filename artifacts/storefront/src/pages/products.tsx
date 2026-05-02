import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const categoryParam = searchParams.get("category") || undefined;
  const qParam = searchParams.get("q") || undefined;

  const [searchInput, setSearchInput] = useState(qParam || "");

  useEffect(() => {
    setSearchInput(qParam || "");
  }, [qParam]);

  const { data: products, isLoading: isProductsLoading } = useListProducts({
    category: categoryParam,
    q: qParam
  });

  const { data: categories, isLoading: isCategoriesLoading } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput || null });
  };

  const updateParams = (updates: { category?: string | null; q?: string | null }) => {
    const params = new URLSearchParams(searchString);
    
    if (updates.category !== undefined) {
      if (updates.category === null) params.delete("category");
      else params.set("category", updates.category);
    }
    
    if (updates.q !== undefined) {
      if (updates.q === null) params.delete("q");
      else params.set("q", updates.q);
    }
    
    const newSearch = params.toString();
    setLocation(newSearch ? `/products?${newSearch}` : "/products");
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-3">
            {categoryParam ? `Shop ${categories?.find(c => c.slug === categoryParam)?.name || categoryParam}` : "All Products"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {qParam ? `Search results for "${qParam}"` : "Discover our complete collection."}
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full md:w-auto max-w-sm gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-10 w-full"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ q: null });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
              <Filter className="h-4 w-4" /> Categories
            </h3>
            
            {isCategoriesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => updateParams({ category: null })}
                  className={`text-left px-3 py-2 rounded-md transition-colors text-sm font-medium ${!categoryParam ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  All Categories
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => updateParams({ category: cat.slug })}
                    className={`text-left px-3 py-2 rounded-md transition-colors text-sm flex justify-between items-center ${categoryParam === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-60">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isProductsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border/50">
              <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border/50">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We couldn't find any products matching your current filters. Try adjusting your search or clearing filters.
              </p>
              <Button onClick={() => updateParams({ category: null, q: null })} variant="outline">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
