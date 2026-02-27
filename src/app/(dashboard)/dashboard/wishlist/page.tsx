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
        <Link href="/dashboard/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-display font-bold text-gray-900">Wishlist</h1>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">Your wishlist is empty</p>
          <p className="text-sm text-gray-500 mb-6">Save items you love for later</p>
          <Link href="/shop" className="inline-block px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600">
            Browse shop
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </motion.div>
      )}
    </div>
  );
}
