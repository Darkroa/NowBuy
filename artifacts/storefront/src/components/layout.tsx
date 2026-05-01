import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  useGetCurrentUser,
  signOut,
  getGetCurrentUserQueryKey,
  getGetCartQueryKey,
  getListOrdersQueryKey,
  getListChatMessagesQueryKey,
} from "@workspace/api-client-react";
import {
  ShoppingBag,
  MessageSquare,
  Package,
  Store,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffSidebarTrigger } from "@/components/staff-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const { data: meData } = useGetCurrentUser();
  const me = meData?.user ?? null;

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const isAssistant = location === "/assistant";
  const isAuthPage = location === "/account";
  const isStaff = me && (me.role === "admin" || me.role === "pm");

  async function handleSignOut() {
    await signOut();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() }),
    ]);
    setLocation("/");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <Link href="/" className="mr-4 flex items-center shrink-0">
            <span className="font-serif font-bold text-xl text-primary tracking-tight">NowBuy</span>
          </Link>

          <nav className="flex flex-1 items-center justify-between min-w-0">
            <div className="flex items-center space-x-1 text-sm font-medium">
              <Link href="/products" className={`transition-colors hover:text-primary rounded-md px-2 py-1.5 ${location === "/products" || location.startsWith("/products") ? "text-primary" : "text-muted-foreground"}`}>
                <span className="flex items-center gap-1.5">
                  <Store className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Shop</span>
                </span>
              </Link>
              <Link href="/assistant" className={`transition-colors hover:text-primary rounded-md px-2 py-1.5 ${location === "/assistant" ? "text-primary" : "text-muted-foreground"}`}>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Assistant</span>
                </span>
              </Link>
              <Link href="/orders" className={`transition-colors hover:text-primary rounded-md px-2 py-1.5 ${location === "/orders" || location.startsWith("/orders") ? "text-primary" : "text-muted-foreground"}`}>
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Orders</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {me ? (
                <>
                  {isStaff ? (
                    <StaffSidebarTrigger
                      role={me.role as "admin" | "pm"}
                      name={me.name}
                    />
                  ) : (
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
                      <UserCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{me.name}</span>
                    </div>
                  )}
                  {!isStaff && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      onClick={handleSignOut}
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Link href="/account">
                  <Button size="sm" className="text-xs h-8 px-3">Sign in</Button>
                </Link>
              )}

              <Link href="/cart">
                <Button variant="outline" size="icon" className="relative h-8 w-8 rounded-full border-border/50 hover:bg-primary/10 hover:text-primary transition-all">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isAssistant && !isAuthPage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/assistant">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 h-12 px-5 text-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
