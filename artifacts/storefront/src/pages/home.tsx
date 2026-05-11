import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetStorefrontSummary, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedCarousel } from "@/components/featured-carousel";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [catsExpanded, setCatsExpanded] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useGetStorefrontSummary();
  const { data: categories, isLoading: isCategoriesLoading } = useListCategories();

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      sessionStorage.setItem("initial_assistant_query", query);
      setLocation("/assistant");
    }
  };

  const visibleCats = catsExpanded ? categories : categories?.slice(0, 6);

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

      {/* Featured Carousel */}
      <section className="py-12 container max-w-screen-xl mx-auto px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight">Featured</h2>
            <p className="text-muted-foreground mt-1 text-sm">Handpicked products, updated regularly.</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="gap-2 group">
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        <FeaturedCarousel />
      </section>

      {/* New arrivals */}
      <section className="pb-12 container max-w-screen-xl mx-auto px-6">
        <h2 className="text-2xl font-serif font-bold tracking-tight mb-6">New arrivals</h2>
        {isSummaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {summary?.featured?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Shop by Category — compact collapsible */}
      <section className="py-10 bg-muted/30 border-t border-border/40">
        <div className="container max-w-screen-xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold tracking-tight">Shop by Category</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">Explore our curated departments.</p>
            </div>
            <button
              onClick={() => setCatsExpanded(e => !e)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {catsExpanded ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> All categories</>}
            </button>
          </div>

          {isCategoriesLoading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleCats?.map((category) => (
                <Link key={category.slug} href={`/products?category=${category.slug}`}>
                  <div className="group flex items-center gap-2 rounded-full bg-card border border-border/50 px-4 py-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{category.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{category.productCount}</span>
                  </div>
                </Link>
              ))}
              {!catsExpanded && (categories?.length ?? 0) > 6 && (
                <button
                  onClick={() => setCatsExpanded(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                >
                  +{(categories?.length ?? 0) - 6} more
                </button>
              )}
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
