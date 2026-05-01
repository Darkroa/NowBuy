import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { ProductForm } from "@/components/product-form";
import { OrdersManager } from "@/components/orders-manager";
import { StaffPageHeader } from "@/components/staff-page-header";
import { ClipboardList, Package, PackagePlus } from "lucide-react";

type Section = "dashboard" | "orders" | "catalog";

export default function PMConsole({ section = "dashboard" }: { section?: Section }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetCurrentUser();
  const me = data?.user ?? null;

  useEffect(() => {
    if (!isLoading && (!me || (me.role !== "pm" && me.role !== "admin"))) {
      setLocation("/account");
    }
  }, [isLoading, me, setLocation]);

  if (isLoading || !me || (me.role !== "pm" && me.role !== "admin")) return null;

  return (
    <div className="container max-w-screen-xl mx-auto px-6 py-10 space-y-8">
      {section === "dashboard" && (
        <>
          <StaffPageHeader
            icon={ClipboardList}
            title="PM console"
            description={`Publish new products and keep orders moving. Welcome, ${me.name}.`}
          />
          <ProductForm sellerName={me.name} />
          <OrdersManager />
        </>
      )}

      {section === "orders" && (
        <>
          <StaffPageHeader
            icon={Package}
            title="Orders"
            description="Track every order and update its status."
          />
          <OrdersManager />
        </>
      )}

      {section === "catalog" && (
        <>
          <StaffPageHeader
            icon={PackagePlus}
            title="Add a product"
            description="List a new item in the NowBuy catalog."
          />
          <ProductForm sellerName={me.name} />
        </>
      )}
    </div>
  );
}
