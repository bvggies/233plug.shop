"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("products").select("*").limit(12);
        setProducts(data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="min-w-[280px] h-[360px] shrink-0" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No products yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
    >
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="min-w-[280px] shrink-0"
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
