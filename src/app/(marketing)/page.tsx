"use client";

import { Hero } from "@/components/hero/Hero";
import { CategorySection } from "@/components/home/CategorySection";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

const LAYOUTS: Array<"featured-hero" | "bento" | "horizontal-scroll" | "alternating"> = [
  "featured-hero",
  "bento",
  "horizontal-scroll",
  "alternating",
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        setCategories((data as Category[]) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <Hero
        title="Shop Premium Products"
        subtitle="Perfumes, sneakers, electronics & accessories. Request-to-buy sourcing from Ghana."
        ctaText="Shop Now"
        ctaHref="/shop"
        secondaryCtaText="Request an Item"
        secondaryCtaHref="/request"
      />

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <CategorySection
              name={cat.name}
              slug={cat.slug}
              layout={LAYOUTS[i % LAYOUTS.length]}
              accent="bg-accent-500 text-white hover:bg-accent-600"
            />
          </motion.div>
        ))
      )}
    </div>
  );
}
