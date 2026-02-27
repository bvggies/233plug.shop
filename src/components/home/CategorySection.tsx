"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import type { Product } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

type LayoutVariant = "featured-hero" | "bento" | "horizontal-scroll" | "alternating";

interface CategorySectionProps {
  name: string;
  slug: string;
  layout: LayoutVariant;
  accent: string;
}

function ProductTile({
  product,
  size = "normal",
  showAddToCart = true,
}: {
  product: Product;
  size?: "normal" | "compact" | "large";
  showAddToCart?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const image = product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      product,
    });
    toast.success("Added to cart");
  };

  const isLarge = size === "large";
  const isCompact = size === "compact";

  return (
    <Link href={`/shop/${product.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -6 }}
        className="group h-full rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300"
      >
        <div
          className={`relative overflow-hidden bg-gray-100 ${
            isLarge ? "aspect-[4/5]" : isCompact ? "aspect-square" : "aspect-square"
          }`}
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes={isLarge ? "600px" : "400px"}
              unoptimized={image.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl font-display">233</span>
            </div>
          )}
          {showAddToCart && product.stock > 0 && (
            <motion.button
              onClick={handleAddToCart}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium opacity-90 hover:opacity-100 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to cart
            </motion.button>
          )}
        </div>
        <div className={isCompact ? "p-3" : "p-4"}>
          <h3 className={`font-medium text-gray-900 line-clamp-2 ${isCompact ? "text-sm" : ""}`}>
            {product.name}
          </h3>
          <p className={`text-primary-600 font-semibold ${isCompact ? "text-sm mt-0.5" : "mt-1"}`}>
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

export function CategorySection({ name, slug, layout, accent }: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", slug).single();
        if (!cat) {
          setProducts([]);
          return;
        }
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", cat.id)
          .order("created_at", { ascending: false })
          .limit(8);
        setProducts((data as Product[]) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, supabase]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, staggerDirection: 1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between gap-4 mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight">
          {name}
        </h2>
        <Link
          href={`/shop?category=${slug}`}
          className="group flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition"
        >
          View all
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {layout === "featured-hero" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6"
        >
          <motion.div variants={itemVariants} className="lg:col-span-7">
            {products[0] && (
              <div className="h-full min-h-[400px] md:min-h-[500px]">
                <ProductTile product={products[0]} size="large" />
              </div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="lg:col-span-5 grid grid-cols-2 gap-4 md:gap-6">
            {products.slice(1, 5).map((p) => (
              <ProductTile key={p.id} product={p} size="compact" />
            ))}
          </motion.div>
        </motion.div>
      )}

      {layout === "bento" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2">
            {products[0] && (
              <div className="h-full min-h-[280px] md:min-h-[400px]">
                <ProductTile product={products[0]} size="large" />
              </div>
            )}
          </motion.div>
          {products.slice(1, 5).map((p) => (
            <motion.div key={p.id} variants={itemVariants}>
              <ProductTile product={p} size="compact" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {layout === "horizontal-scroll" && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative -mx-4 md:-mx-6"
        >
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide snap-x snap-mandatory">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[260px] md:w-[300px] snap-start"
              >
                <ProductTile product={p} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {layout === "alternating" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              variants={itemVariants}
              className={`${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              <Link href={`/shop/${p.id}`} className="block h-full">
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group h-full rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-soft hover:shadow-soft-lg transition-all"
                >
                  <div className={`relative overflow-hidden bg-gray-100 ${i === 0 ? "aspect-[4/5]" : "aspect-square"}`}>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes={i === 0 ? "600px" : "300px"}
                        unoptimized={p.images[0].startsWith("http")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl font-display">233</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 ${i === 0 ? "md:p-6" : ""}`}>
                    <h3 className={`font-display font-semibold text-gray-900 ${i === 0 ? "text-xl md:text-2xl" : "text-base"}`}>
                      {p.name}
                    </h3>
                    <p className={`text-primary-600 font-semibold mt-1 ${i === 0 ? "text-lg" : "text-sm"}`}>
                      {formatPrice(p.price, p.currency)}
                    </p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
