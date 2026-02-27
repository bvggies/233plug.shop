"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["admin", "staff", "super_admin"];

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/coupons", label: "Coupons" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile?.role as UserRole) || "user";
      if (!ADMIN_ROLES.includes(role)) {
        router.replace("/");
        return;
      }
      setLoading(false);
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link
            href="/admin"
            className="text-xl font-display font-bold text-primary-500"
          >
            233Plug Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition",
                pathname === item.href
                  ? "bg-primary-500/10 text-primary-600"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            Back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
