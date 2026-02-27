"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Image,
  FileText,
  HelpCircle,
  Mail,
  Package,
  ShoppingBag,
  Truck,
  Ticket,
  ExternalLink,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["admin", "staff", "super_admin"];

const navGroups = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/hero", label: "Hero Slides", icon: Image },
      { href: "/admin/pages", label: "Site Pages", icon: FileText },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/contact", label: "Contact", icon: Mail },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/requests", label: "Requests", icon: ShoppingBag },
      { href: "/admin/shipments", label: "Shipments", icon: Truck },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { name?: string } } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
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

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading admin...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-gray-100">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white font-bold text-lg">23</span>
          </div>
          <div>
            <span className="font-display font-bold text-gray-900 block">233Plug</span>
            <span className="text-xs text-gray-500">Admin</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "bg-primary-500/10 text-primary-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn("w-5 h-5 flex-shrink-0", isActive(item.href) ? "text-primary-600" : "text-gray-400")}
                  />
                  {item.label}
                  {isActive(item.href) && (
                    <ChevronRight className="w-4 h-4 ml-auto text-primary-500" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2 mb-2 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.user_metadata?.name || user?.email || "Admin"}
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <ExternalLink className="w-5 h-5" />
          View site
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-200 flex flex-col z-50 lg:hidden transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-72 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View site</span>
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
