"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const orderId = searchParams.get("order");

  useEffect(() => {
    clearCart();
    if (orderId) router.replace(`/dashboard/orders/${orderId}/receipt`);
  }, [clearCart, orderId, router]);

  if (orderId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading your receipt...</p>
      </div>
    );
  }

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
        href="/dashboard"
        className="inline-block px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
      >
        View orders
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
