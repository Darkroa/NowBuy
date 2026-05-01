import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetStorefrontSummary, useListCategories, useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  
  const { data: summary, isLoading: isSummaryLoading } = useGetStorefrontSummary();
  const { data: categories, isLoading: isCategoriesLoading } = useListCategories();

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Store the initial query in sessionStorage to pick it up on the assistant page
      sessionStorage.setItem("initial_assistant_query", query);
      setLocation("/assistant");
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:py-40 overflow-hidden bg-primary/5 border-b border-border/40">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none py-1.5 px-4 rounded-full text-sm font-medium inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4" /> AI-Powered Shopping
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground balance-text">
            Your personal concierge for <span className="text-primary italic">everything.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tell our AI what you're looking for, and we'll find the perfect match. No endless scrolling required.
          </p>

          <form onSubmit={handleAskAI} className="relative max-w-2xl mx-auto mt-10 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-card rounded-full p-2 border-2 border-primary/20 shadow-xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
              <Search className="h-6 w-6 text-muted-foreground ml-4" />
              <Input
                type="text"
                placeholder="Tell me what you need..."
                className="flex-1 border-0 bg-transparent text-lg shadow-none focus-visible:ring-0 px-4 h-14 placeholder:text-muted-foreground/60"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" size="lg" className="rounded-full h-12 px-8 font-semibold text-base gap-2">
                Ask AI <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </form>

          {summary?.trendingSearches && summary.trendingSearches.length > 0 && (
            <div className="pt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Trending:</span>
              {summary.trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    sessionStorage.setItem("initial_assistant_query", `I'm looking for ${term}`);
                    setLocation("/assistant");
                  }}
                  className="text-sm px-4 py-1.5 rounded-full bg-card border border-border/50 text-foreground hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 container max-w-screen-xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight">Featured Collection</h2>
            <p className="text-muted-foreground mt-2">Handpicked items you might love.</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="gap-2 group">
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isSummaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {summary?.featured?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="py-20 bg-muted/30 border-t border-border/40">
        <div className="container max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Shop by Category</h2>
            <p className="text-muted-foreground mt-2">Explore our curated departments.</p>
          </div>

          {isCategoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories?.map((category) => (
                <Link key={category.slug} href={`/products?category=${category.slug}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                    <h3 className="font-serif font-bold text-xl group-hover:text-primary transition-colors">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{category.productCount} items</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
