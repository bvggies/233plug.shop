"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, Search, Sparkles, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { Logo } from "@/components/ui/Logo";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Notification = { id: string; message: string; read: boolean; created_at: string };

export function Header() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const supabase = createClient();
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    supabase
      .from("notifications")
      .select("id, message, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []));
  }, [user?.id, supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/dashboard", label: "Tracking" },
    { href: "/cart", label: "Cart" },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-neutral-200/80 dark:border-[var(--surface-border)] dark:glass-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors lg:text-base"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/request" className="hidden md:block ml-2 lg:ml-4">
              <motion.span
                className="btn-accent inline-flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-4 h-4" />
                Request Item
              </motion.span>
            </Link>
          </nav>

          <div className="flex items-center gap-1 lg:gap-2">
            <CurrencySwitcher className="hidden sm:block" />
            <ThemeToggle />
            <Link
              href="/shop"
              className="p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-auto rounded-2xl shadow-[var(--shadow-float)] py-2 z-50 glass-premium border border-[var(--border-glass)] dark:border-white/10 backdrop-blur-xl bg-white/95 dark:bg-[var(--surface-card)]"
                    >
                      <p className="px-4 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-[var(--surface-border)]">
                        Notifications
                      </p>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400 text-center">No notifications yet.</p>
                      ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-[var(--surface-border)]">
                          {notifications.map((n) => (
                            <li
                              key={n.id}
                              className={`px-4 py-3 text-sm transition-colors ${!n.read ? "bg-primary-600/10 dark:bg-emerald-500/10" : "hover:bg-neutral-50 dark:hover:bg-white/5"}`}
                            >
                              <p className="text-neutral-900 dark:text-neutral-100">{n.message}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatDate(n.created_at)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                      {notifications.length > 0 && (
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="block px-4 py-2 text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          View all
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-500 text-white text-[10px] font-bold rounded-full">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors lg:p-3"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              className="md:hidden p-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-100 dark:border-neutral-700 py-4"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-3 px-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => setOpen(false)}
                  className="py-3 px-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-lg"
                >
                  {user ? "Dashboard" : "Sign In"}
                </Link>
                <Link href="/request" onClick={() => setOpen(false)} className="mt-2">
                  <motion.span
                    className="btn-accent flex items-center justify-center gap-2 w-full py-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Request Item
                  </motion.span>
                </Link>
                <div className="px-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <CurrencySwitcher />
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
