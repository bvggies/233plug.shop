"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, Search } from "lucide-react";
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
    { href: "/request", label: "Request" },
    { href: "/cart", label: "Cart" },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/233plug-logo.jpg"
              alt="233Plug"
              width={100}
              height={36}
              className="h-9 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary-500 font-medium transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-500 text-white text-xs font-bold rounded-full">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              className="md:hidden p-2"
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
              className="md:hidden border-t border-gray-100 py-4"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-2 text-gray-700 hover:text-primary-500 font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => setOpen(false)}
                  className="py-2 text-gray-700 hover:text-primary-500 font-medium"
                >
                  {user ? "Dashboard" : "Sign In"}
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
