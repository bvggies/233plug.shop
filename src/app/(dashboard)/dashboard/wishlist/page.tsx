"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Heart, ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

type WishlistItem = { product_id: string; products: Product & { category?: { name: string } } | Product[] };

export default function DashboardWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wishlists")
        .select("product_id, products(*, category:categories(name))")
        .eq("user_id", user.id);
      setItems((data ?? []) as WishlistItem[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const products = items.map((i) => i.products).filter((p): p is Product => p != null && !Array.isArray(p));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/profile" className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <h1 className="section-title text-neutral-900 dark:text-neutral-100">Wishlist</h1>
      </div>

      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-2xl md:rounded-3xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary-500 dark:text-primary-400" />
          </div>
          <p className="text-neutral-700 dark:text-neutral-300 mb-2">Your wishlist is empty</p>
          <p className="text-description mb-6">Save items you love for later</p>
          <Link href="/shop" className="btn-primary inline-flex">
            Browse shop
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard product={p} compact />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
