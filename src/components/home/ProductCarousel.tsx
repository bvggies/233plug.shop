"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProductCarouselProps {
  title?: string;
  viewAllHref?: string;
  products?: Product[] | null;
  query?: "trending" | "hot_deal" | "new" | "all";
  limit?: number;
}

export function ProductCarousel({
  title,
  viewAllHref,
  products: productsProp,
  query = "all",
  limit = 12,
}: ProductCarouselProps) {
  const [products, setProducts] = useState<Product[]>(productsProp ?? []);
  const [loading, setLoading] = useState(!productsProp);
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productsProp != null) {
      setProducts(productsProp);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        let q = supabase.from("products").select("*, category:categories(*)");
        if (query === "trending") {
          q = q.eq("is_trending", true);
        } else if (query === "hot_deal") {
          q = q.eq("is_hot_deal", true);
        } else if (query === "new") {
          q = q.order("created_at", { ascending: false });
        }
        q = q.limit(limit);
        const { data } = await q;
        setProducts((data as Product[]) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productsProp, query, limit, supabase]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {title && (
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="min-w-[280px] h-[360px] shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-end justify-between gap-4 mb-6">
        {title && (
          <h2 className="section-title text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        )}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 text-sm"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 scrollbar-hide snap-x snap-mandatory"
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: i * 0.05 }}
            className="min-w-[260px] sm:min-w-[280px] shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
