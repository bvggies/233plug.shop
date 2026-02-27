"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">✓</div>
      <h1 className="text-2xl font-display font-bold text-primary-600 mb-2">
        Order placed!
      </h1>
      <p className="text-gray-500 mb-8">
        Thank you for your order. We&apos;ll notify you when it ships.
      </p>
      <Link
        href="/dashboard/orders"
        className="inline-block px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
      >
        View orders
      </Link>
    </div>
  );
}
