"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
    const orderId = searchParams.get("order");
    if (orderId) {
      router.replace(`/dashboard/orders/${orderId}/receipt`);
    } else {
      router.replace("/dashboard?success=1");
    }
  }, [clearCart, router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="text-gray-500">Processing your payment...</p>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
