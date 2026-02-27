"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeItem } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 mb-6">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">
          Add items from the shop to get started.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const total = totalPrice();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Your Cart
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
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
                className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
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
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-display">
                      233
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={product ? `/shop/${product.id}` : "/shop"}
                    className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                  >
                    {product?.name ?? "Product"}
                  </Link>
                  <p className="text-primary-600 font-semibold mt-1">
                    {formatPrice(item.price, product?.currency ?? "GHS")}
                  </p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.max(1, item.quantity - 1),
                            item.variant_id
                          )
                        }
                        className="p-2 text-gray-600 hover:bg-gray-50 transition"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
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
                        className="p-2 text-gray-600 hover:bg-gray-50 transition"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        removeItem(item.product_id, item.variant_id)
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity, product?.currency ?? "GHS")}
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
          <div className="sticky top-24 p-6 bg-white rounded-2xl border border-gray-100 shadow-soft">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              Order summary
            </h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({items.length})</span>
                <span>{formatPrice(total, "GHS")}</span>
              </div>
              <div className="flex justify-between font-semibold text-xl pt-4 border-t border-gray-100">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total, "GHS")}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-4 px-6 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition"
            >
              Proceed to checkout
            </button>
            <Link
              href="/shop"
              className="block mt-4 text-center text-gray-500 hover:text-primary-600 text-sm font-medium"
            >
              Continue shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
