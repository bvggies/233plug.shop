"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDisplayPrice, DisplayPrice } from "@/hooks/useDisplayPrice";
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
  const displayPrice = useDisplayPrice(product.price, product.currency);
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
        className="group h-full surface-card-hover overflow-hidden"
      >
        <div
          className={`relative overflow-hidden bg-neutral-100 dark:bg-neutral-800/80 ${
            isLarge ? "aspect-[3/4] md:aspect-auto md:h-full min-h-0" : isCompact ? "aspect-square" : "aspect-square"
          }`}
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes={isLarge ? "(max-width: 768px) 100vw, 380px" : "(max-width: 768px) 50vw, 220px"}
              unoptimized={image.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <span className="text-4xl font-display">233</span>
            </div>
          )}
          {showAddToCart && product.stock > 0 && (
            <motion.button
              onClick={handleAddToCart}
              className="btn-primary absolute bottom-3 left-1/2 -translate-x-1/2 opacity-95 hover:opacity-100 text-sm py-2"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to cart
            </motion.button>
          )}
        </div>
        <div className={isCompact ? "p-2.5 md:p-3" : "p-3 md:p-4"}>
          <h3 className={`font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 ${isCompact ? "text-xs md:text-sm" : "text-sm md:text-base"}`}>
            {product.name}
          </h3>
          <p className={`text-primary-600 dark:text-primary-400 font-semibold ${isCompact ? "text-xs md:text-sm mt-0.5" : "text-sm mt-1"}`}>
            {displayPrice}
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between gap-4 mb-6 md:mb-8"
      >
        <h2 className="section-title text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100 tracking-tight">
          {name}
        </h2>
        <Link
          href={`/shop?category=${slug}`}
          className="group flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition text-sm"
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
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4"
        >
          <motion.div variants={itemVariants} className="lg:col-span-6">
            {products[0] && (
              <div className="h-full min-h-[260px] md:min-h-0 md:h-[320px]">
                <ProductTile product={products[0]} size="large" />
              </div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="lg:col-span-6 grid grid-cols-2 gap-3 md:gap-4">
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
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3"
        >
          <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2">
            {products[0] && (
              <div className="h-full min-h-[200px] md:min-h-0 md:h-[280px]">
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
          className="relative -mx-4 md:-mx-4"
        >
          <div className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[44vw] sm:w-[200px] md:w-[220px] snap-start"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
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
                  className="group h-full surface-card-hover overflow-hidden"
                >
                  <div className={`relative overflow-hidden bg-gray-100 dark:bg-neutral-800 ${i === 0 ? "h-[220px] md:h-[280px]" : "aspect-square"}`}>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes={i === 0 ? "(max-width: 768px) 100vw, 400px" : "(max-width: 768px) 50vw, 240px"}
                        unoptimized={p.images[0].startsWith("http")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <span className="text-4xl font-display">233</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 md:p-4 ${i === 0 ? "md:p-4" : ""}`}>
                    <h3 className={`font-display font-semibold text-gray-900 dark:text-gray-100 ${i === 0 ? "text-base md:text-lg" : "text-sm"}`}>
                      {p.name}
                    </h3>
                    <p className={`text-primary-600 font-semibold mt-0.5 ${i === 0 ? "text-sm md:text-base" : "text-xs md:text-sm"}`}>
                      <DisplayPrice amount={p.price} currency={p.currency} />
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
