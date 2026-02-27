"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export function ShopContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchProducts = async () => {
      if (category) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).single();
        if (!cat) {
          setProducts([]);
          setLoading(false);
          return;
        }
        const { data } = await supabase.from("products").select("*, category:categories(*)").eq("category_id", cat.id).order("created_at", { ascending: false });
        setProducts(data ?? []);
      } else {
        const { data } = await supabase.from("products").select("*, category:categories(*)").order("created_at", { ascending: false });
        setProducts(data ?? []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : "All Products"}
        </h1>
        <p className="text-gray-500">
          {products.length} product{products.length !== 1 ? "s" : ""} found
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No products found.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
            hidden: {},
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
