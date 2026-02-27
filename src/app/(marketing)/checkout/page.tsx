"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Wallet } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "stripe" | "wallet">("paystack");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setWalletBalance(data?.wallet_balance ?? 0));
  }, [user, supabase]);

  const total = totalPrice();
  const canUseWallet = walletBalance >= total;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      toast.error("Please sign in to checkout");
      router.push("/login?redirect=/checkout");
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: u.id,
          status: "pending",
          total_price: total,
          currency: "GHS",
        })
        .select("id")
        .single();

      if (orderError || !order) throw orderError;

      await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          quantity: i.quantity,
          price: i.price,
        }))
      );

      if (paymentMethod === "wallet" && canUseWallet) {
        const newBalance = walletBalance - total;
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", u.id);
        await supabase.from("wallet_transactions").insert({
          user_id: u.id,
          amount: -total,
          type: "debit",
          reference_id: order.id,
        });
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);
        await supabase.from("payments").insert({
          user_id: u.id,
          order_id: order.id,
          amount: total,
          currency: "GHS",
          payment_method: "wallet",
          status: "completed",
        });
        clearCart();
        toast.success("Order placed successfully!");
        router.push("/dashboard");
        return;
      }

      if (paymentMethod === "paystack") {
        const res = await fetch("/api/payments/paystack/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            amount: total * 100,
            orderId: order.id,
          }),
        });
        const { authorizationUrl } = await res.json();
        if (authorizationUrl) window.location.href = authorizationUrl;
        else throw new Error("Failed to initialize payment");
      } else {
        const res = await fetch("/api/payments/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            amount: total,
            items,
          }),
        });
        const { url } = await res.json();
        if (url) window.location.href = url;
        else throw new Error("Failed to create checkout session");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-display font-bold mb-4">Your cart is empty</h2>
        <Link href="/shop" className="text-primary-500 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="font-semibold text-lg">Payment method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod("paystack")}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                paymentMethod === "paystack"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span>Paystack (GHS)</span>
            </button>
            <button
              onClick={() => setPaymentMethod("stripe")}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                paymentMethod === "stripe"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span>Stripe (USD)</span>
            </button>
            <button
              onClick={() => setPaymentMethod("wallet")}
              disabled={!canUseWallet}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                paymentMethod === "wallet"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${!canUseWallet ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Wallet className="w-6 h-6" />
              <span>
                Wallet ({formatPrice(walletBalance, "GHS")})
                {!canUseWallet && " - Insufficient balance"}
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft h-fit"
        >
          <h3 className="font-semibold text-lg mb-4">Order total</h3>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between font-semibold text-xl">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(total, "GHS")}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 px-6 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
