"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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

  return (
    <Link href={`/shop/${product.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 280px, 300px"
              unoptimized={image.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl font-display">233</span>
            </div>
          )}
          {product.stock < 5 && product.stock > 0 && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-lg">
              Low stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded-lg">
              Out of stock
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-primary-600 font-semibold mb-3">
            {formatPrice(product.price, product.currency)}
          </p>
          <motion.button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to cart
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
}
