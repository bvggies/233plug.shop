"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/requests", label: "Requests" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/addresses", label: "Addresses" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/wishlist", label: "Wishlist" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-pulse text-neutral-500 dark:text-neutral-400 text-sm font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">
      <aside className="w-64 flex-shrink-0 border-r border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col fixed h-full">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <Logo size="md" href="/dashboard" />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary-500/10 text-primary-600 dark:bg-primary-400/20 dark:text-primary-400"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-6 md:p-8">{children}</main>
    </div>
  );
}
