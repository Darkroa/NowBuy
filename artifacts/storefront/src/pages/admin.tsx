import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { ProductForm } from "@/components/product-form";
import { OrdersManager } from "@/components/orders-manager";
import { UsersManager } from "@/components/users-manager";
import { StaffPageHeader } from "@/components/staff-page-header";
import { ChangeAdminPassword } from "@/components/change-admin-password";
import {
  ShieldCheck,
  Users as UsersIcon,
  Package,
  PackagePlus,
  KeyRound,
} from "lucide-react";

type Section = "dashboard" | "users" | "orders" | "catalog" | "password";

export default function Admin({ section = "dashboard" }: { section?: Section }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetCurrentUser();
  const me = data?.user ?? null;

  useEffect(() => {
    if (!isLoading && (!me || me.role !== "admin")) {
      setLocation("/account");
    }
  }, [isLoading, me, setLocation]);

  if (isLoading || !me || me.role !== "admin") return null;

  return (
    <div className="container max-w-screen-xl mx-auto px-6 py-10 space-y-8">
      {section === "dashboard" && (
        <>
          <StaffPageHeader
            icon={ShieldCheck}
            title="Admin console"
            description={`Welcome back, ${me.name}. Use the menu to manage users, orders, and the catalog.`}
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <UsersManager currentUserId={me.id} />
            <ProductForm sellerName={me.name} />
          </div>
          <OrdersManager />
        </>
      )}

      {section === "users" && (
        <>
          <StaffPageHeader
            icon={UsersIcon}
            title="Users"
            description="Promote, demote, remove accounts, or generate password reset codes."
          />
          <UsersManager currentUserId={me.id} />
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

      {section === "password" && (
        <>
          <StaffPageHeader
            icon={KeyRound}
            title="Change admin password"
            description="Generate a unique admin reset code, then use it to set a new password."
          />
          <ChangeAdminPassword adminEmail={me.email} />
        </>
      )}
    </div>
  );
}
