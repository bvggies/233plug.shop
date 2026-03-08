"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { Logo } from "@/components/ui/Logo";
import {
  ShoppingBag,
  FileText,
  Wallet,
  Gift,
  MapPin,
  Bell,
  Heart,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/requests", label: "Requests", icon: FileText },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string | null; email: string; avatar_url: string | null } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setLoading(false);
      supabase.from("profiles").select("name, email, avatar_url").eq("id", user.id).single().then(({ data }) => setProfile(data as { name: string | null; email: string; avatar_url: string | null } | null));
    });
  }, [supabase, router]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-pulse text-neutral-500 dark:text-neutral-400 text-sm font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 overflow-x-hidden">
      {/* Desktop: full sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-neutral-200/80 dark:border-[var(--surface-border)] bg-white dark:bg-[var(--surface-bg)] flex-col fixed h-full z-30">
        <div className="p-4 border-b border-neutral-100 dark:border-[var(--surface-border)]">
          <Logo size="md" href="/dashboard" />
        </div>
        {/* User profile summary */}
        {profile && (
          <Link
            href="/dashboard/profile"
            className="mx-3 mt-3 p-3 rounded-2xl flex items-center gap-3 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 dark:bg-primary-500/20 flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={40} height={40} className="object-cover" unoptimized={profile.avatar_url.startsWith("http")} />
              ) : (
                <span className="text-sm font-display font-bold text-primary-600 dark:text-primary-400">{(profile.name || profile.email)[0].toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{profile.name || "User"}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{profile.email}</p>
            </div>
          </Link>
        )}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600/20 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-neutral-100"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-100 dark:border-[var(--surface-border)] flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <ThemeToggle placement="up" />
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile: icon-only strip */}
      <aside className="md:hidden flex flex-col fixed left-0 top-0 bottom-0 w-14 flex-shrink-0 border-r border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 border-b border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 mx-auto" />
        </button>
        <nav className="flex-1 py-2 flex flex-col items-center gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                  isActive
                    ? "bg-primary-500/10 text-primary-600 dark:bg-primary-400/20 dark:text-primary-400"
                    : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: full-screen sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            onClick={closeSidebar}
            aria-hidden
          />
          <aside
            className="fixed inset-y-0 left-0 w-full max-w-[min(100vw,320px)] bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-[100] md:hidden flex flex-col overflow-y-auto overflow-x-hidden"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
              <Logo size="md" href="/dashboard" />
              <button
                onClick={closeSidebar}
                className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary-500/10 text-primary-600 dark:bg-primary-400/20 dark:text-primary-400"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Currency</span>
                <CurrencySwitcher />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  closeSidebar();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main content: full width on mobile with left padding for icon strip, desktop with margin for sidebar */}
      <main className="flex-1 w-full min-w-0 pl-14 md:pl-0 md:ml-64 p-4 md:p-6 md:p-8 overflow-x-hidden relative z-0">
        {children}
      </main>
    </div>
  );
}
