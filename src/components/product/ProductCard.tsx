"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { getProductEffectivePrice } from "@/lib/utils";
import type { Product } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const basePrice = product.price;
  const effectivePrice = getProductEffectivePrice(
    basePrice,
    product.discount_type ?? null,
    product.discount_value ?? null
  );
  const hasDiscount = effectivePrice < basePrice;
  const displayPrice = useDisplayPrice(effectivePrice, product.currency);
  const displayOriginalPrice = useDisplayPrice(basePrice, product.currency);
  const image = product.images?.[0];
  const categoryLabel = product.category?.name ?? null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_id: product.id,
      quantity: 1,
      price: effectivePrice,
      product,
    });
    toast.success("Added to cart");
  };

  return (
    <Link href={`/shop/${product.id}`} className="block h-full">
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`group surface-card-hover overflow-hidden flex flex-col h-full ${compact ? "rounded-xl" : "rounded-2xl md:rounded-3xl"}`}
      >
        {/* Top: image - fixed aspect ratio */}
        <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-[var(--surface-border)]">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 280px, 300px"
              unoptimized={image.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500">
              <span className="text-4xl font-display font-medium">233</span>
            </div>
          )}
          {/* Favorite heart */}
          <Link
            href={`/shop/${product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/40 backdrop-blur-sm text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors z-10"
            aria-label="View product"
          >
            <Heart className="w-5 h-5" />
          </Link>
          {/* Badges */}
          {product.is_hot_deal && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white text-[11px] font-semibold rounded-lg uppercase tracking-wide shadow-md">
              Hot Deal
            </span>
          )}
          {product.is_trending && !product.is_hot_deal && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-[11px] font-medium rounded-lg shadow-md">
              Trending
            </span>
          )}
          {product.stock < 5 && product.stock > 0 && !product.is_hot_deal && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-[11px] font-medium rounded-lg">
              Low stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-800 text-white text-[11px] font-medium rounded-lg">
              Out of stock
            </span>
          )}
        </div>

        {/* Content: fixed height so all cards match */}
        <div className={`flex flex-col flex-1 min-h-[200px] ${compact ? "p-3 min-h-[160px]" : "p-4"}`}>
          {categoryLabel && (
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              {categoryLabel}
            </p>
          )}
          <h3 className={`product-title text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2 flex-1 min-h-[2.5em] ${compact ? "text-sm min-h-[2.25em]" : ""}`}>
            {product.name}
          </h3>

          {/* Bottom: price + add to cart - anchored to bottom */}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-auto pt-2">
            <div className={`font-bold text-primary-600 dark:text-primary-400 ${compact ? "text-sm" : "text-lg"}`}>
              {hasDiscount && (
                <span className="line-through text-neutral-500 dark:text-neutral-400 font-normal text-sm mr-1.5">
                  {displayOriginalPrice}
                </span>
              )}
              {displayPrice}
            </div>
            <motion.button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
              Add to cart
            </motion.button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
