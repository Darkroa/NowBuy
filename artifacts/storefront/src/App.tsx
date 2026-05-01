import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Assistant from "@/pages/assistant";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Payment from "@/pages/payment";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import PMConsole from "@/pages/pm";
import ResetPassword from "@/pages/reset-password";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment" component={Payment} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/account" component={Account} />
        <Route path="/signin" component={Account} />
        <Route path="/signup" component={Account} />
        <Route path="/admin" component={() => <Admin section="dashboard" />} />
        <Route path="/admin/users" component={() => <Admin section="users" />} />
        <Route path="/admin/orders" component={() => <Admin section="orders" />} />
        <Route path="/admin/catalog" component={() => <Admin section="catalog" />} />
        <Route path="/admin/password" component={() => <Admin section="password" />} />
        <Route path="/pm" component={() => <PMConsole section="dashboard" />} />
        <Route path="/pm/orders" component={() => <PMConsole section="orders" />} />
        <Route path="/pm/catalog" component={() => <PMConsole section="catalog" />} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
