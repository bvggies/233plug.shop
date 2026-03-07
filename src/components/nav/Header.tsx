"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, Search, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/cart", label: "Cart" },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-neutral-200/80 dark:border-neutral-700/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/request" className="hidden md:block ml-2">
              <motion.span
                className="btn-accent inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-4 h-4" />
                Request Item
              </motion.span>
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/shop"
              className="p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-neutral-700/80 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-700/80 transition-colors"
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
              className="p-2.5 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-neutral-700/80 transition-colors"
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
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
