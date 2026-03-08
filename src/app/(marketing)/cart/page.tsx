"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useDisplayPrice, DisplayPrice } from "@/hooks/useDisplayPrice";

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeItem } = useCartStore();
  const total = totalPrice();
  const displayTotal = useDisplayPrice(total, "GHS");

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 lg:py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 mb-6 lg:mb-8">
          <ShoppingCart className="w-10 h-10 lg:w-12 lg:h-12" />
        </div>
        <h2 className="section-title text-2xl lg:text-3xl text-neutral-900 dark:text-neutral-100 mb-2">
          Your cart is empty
        </h2>
        <p className="text-description mb-6 lg:mb-8">
          Add items from the shop to get started.
        </p>
        <Link
          href="/shop"
          className="btn-primary px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="section-title text-2xl lg:text-3xl text-neutral-900 dark:text-neutral-100 tracking-tight mb-6 lg:mb-10">
        Your Cart
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-4"
        >
          {items.map((item, i) => {
            const product = item.product;
            const image = product?.images?.[0];

            return (
              <motion.div
                key={`${item.product_id}-${item.variant_id ?? "x"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 p-4 lg:p-5 rounded-2xl lg:rounded-3xl surface-card surface-card-hover"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800/80">
                  {image ? (
                    <Image
                      src={image}
                      alt={product?.name ?? "Product"}
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={image.startsWith("http")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 text-2xl font-display">
                      233
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={product ? `/shop/${product.id}` : "/shop"}
                    className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 transition-colors"
                  >
                    {product?.name ?? "Product"}
                  </Link>
                  <p className="text-primary-600 dark:text-primary-400 font-semibold mt-1">
                    <DisplayPrice amount={item.price} currency={product?.currency ?? "GHS"} />
                  </p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-neutral-200 dark:border-[var(--surface-border)] rounded-xl overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.max(1, item.quantity - 1),
                            item.variant_id
                          )
                        }
                        className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            item.quantity + 1,
                            item.variant_id
                          )
                        }
                        className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        removeItem(item.product_id, item.variant_id)
                      }
                      className="p-2.5 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    <DisplayPrice amount={item.price * item.quantity} currency={product?.currency ?? "GHS"} />
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 lg:top-28 p-5 lg:p-6 rounded-2xl lg:rounded-3xl surface-card">
            <h3 className="section-title text-lg lg:text-xl text-neutral-900 dark:text-neutral-100 mb-4 lg:mb-5">
              Order summary
            </h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-description text-sm lg:text-base">
                <span>Items ({items.length})</span>
                <span>{displayTotal}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg lg:text-xl pt-4 border-t border-neutral-200 dark:border-[var(--surface-border)]">
                <span className="text-neutral-900 dark:text-neutral-100">Total</span>
                <span className="text-primary-600 dark:text-primary-400">{displayTotal}</span>
              </div>
            </div>
            <motion.button
              onClick={() => router.push("/checkout")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3.5 lg:py-4 rounded-xl"
            >
              Proceed to checkout
            </motion.button>
            <Link
              href="/shop"
              className="block mt-4 text-center text-description hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
