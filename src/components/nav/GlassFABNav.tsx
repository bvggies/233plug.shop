"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, FileText, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/request", icon: FileText, label: "Requests" },
  { href: "/cart", icon: ShoppingCart, label: "Cart", badge: true },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function GlassFABNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScroll || current < 100);
      setLastScroll(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md z-50 transition-all duration-300",
          !visible && "translate-y-24 opacity-0 pointer-events-none"
        )}
      >
        <div className="glass-card flex items-center justify-around py-3 px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 min-w-[56px]"
              >
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-xl transition-colors min-w-[44px]",
                    isActive ? "bg-primary-500/12 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400" : "text-gray-500 hover:text-primary-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-700/80"
                  )}
                >
                  {item.badge && totalItems > 0 ? (
                    <span className="relative">
                      <Icon className="w-6 h-6" />
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-500 text-white text-xs font-bold rounded-full px-1">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    </span>
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
