"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Wallet, Tag, X, Shield, MapPin } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { useCurrencyStore } from "@/store/currency-store";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type CouponResult = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  expiry: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  max_uses_per_user: number | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "stripe" | "wallet">("paystack");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [defaultAddress, setDefaultAddress] = useState<{
    id: string;
    label: string;
    address: string;
    city: string | null;
    country: string;
    phone: string | null;
  } | null>(null);
  const supabase = createClient();
  const currency = useCurrencyStore((s) => s.currency);
  const convert = useCurrencyStore((s) => s.convert);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance, address")
        .eq("id", user.id)
        .single();
      if (profile) {
        setWalletBalance(profile.wallet_balance ?? 0);
      }
      const { data: addresses } = await supabase
        .from("addresses")
        .select("id, label, address, city, country, phone")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      const defaultAddr = Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : null;
      if (defaultAddr) {
        setDefaultAddress(defaultAddr as typeof defaultAddress);
        const parts = [
          (defaultAddr as { label?: string }).label,
          (defaultAddr as { address: string }).address,
          (defaultAddr as { city?: string | null }).city,
          (defaultAddr as { country: string }).country,
          (defaultAddr as { phone?: string | null }).phone,
        ].filter(Boolean);
        setShippingAddress(parts.join(", "));
      } else if (profile?.address) {
        setShippingAddress(profile.address);
      }
    })();
  }, [user, supabase]);

  // Convert cart to GHS for order/payment (orders are stored in GHS). Use defaults until mounted to avoid hydration mismatch.
  const subtotalInGhs = mounted
    ? items.reduce(
        (sum, i) => sum + convert(i.price * i.quantity, i.product?.currency ?? "GHS", "GHS"),
        0
      )
    : 0;
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percent"
      ? (subtotalInGhs * appliedCoupon.value) / 100
      : Math.min(appliedCoupon.value, subtotalInGhs)
    : 0;
  const totalInGhs = Math.max(0, subtotalInGhs - discountAmount);
  const canUseWallet = walletBalance >= totalInGhs;
  const displaySubtotal = useDisplayPrice(subtotalInGhs, "GHS");
  const displayDiscount = useDisplayPrice(discountAmount, "GHS");
  const displayTotal = useDisplayPrice(totalInGhs, "GHS");
  const displayWallet = useDisplayPrice(walletBalance, "GHS");

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setApplying(true);
    setCouponError("");
    try {
      const { data: sessionUser } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("coupons")
        .select("id, code, discount_type, value, min_order, expiry, usage_limit, used_count, is_active, max_uses_per_user")
        .ilike("code", code)
        .single();
      if (error || !data) {
        setCouponError("Invalid or expired coupon");
        return;
      }
      const c = data as CouponResult;
      if (c.is_active === false) {
        setCouponError("This coupon is not active");
        return;
      }
      if (c.expiry && new Date(c.expiry) < new Date()) {
        setCouponError("Coupon has expired");
        return;
      }
      if (c.usage_limit != null && c.usage_limit > 0 && c.used_count >= c.usage_limit) {
        setCouponError("Coupon usage limit reached");
        return;
      }
      if (c.max_uses_per_user != null && c.max_uses_per_user > 0 && sessionUser?.user?.id) {
        const { count, error: countErr } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sessionUser.user.id)
          .eq("coupon_id", c.id);
        if (!countErr && count != null && count >= c.max_uses_per_user) {
          setCouponError("You have already used this coupon the maximum number of times");
          return;
        }
      }
      if (subtotalInGhs < c.min_order) {
        const minDisplay = currency === "GHS" ? c.min_order : convert(c.min_order, "GHS", currency);
        setCouponError(`Minimum order of ${formatPrice(minDisplay, currency)} required`);
        return;
      }
      setAppliedCoupon(c);
      toast.success("Coupon applied!");
    } catch {
      setCouponError("Could not apply coupon");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

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
          total_price: totalInGhs,
          currency: "GHS",
          coupon_id: appliedCoupon?.id || null,
          discount_amount: discountAmount || 0,
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
        const newBalance = walletBalance - totalInGhs;
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", u.id);
        if (appliedCoupon) {
          await supabase.from("coupons").update({ used_count: (appliedCoupon.used_count ?? 0) + 1 }).eq("id", appliedCoupon.id);
        }
        await supabase.from("wallet_transactions").insert({
          user_id: u.id,
          amount: -totalInGhs,
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
          amount: totalInGhs,
          currency: "GHS",
          payment_method: "wallet",
          status: "completed",
        });
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/dashboard/orders/${order.id}/receipt`);
        return;
      }

      if (paymentMethod === "paystack") {
        const res = await fetch("/api/payments/paystack/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            amount: Math.round(totalInGhs * 100),
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
            amount: totalInGhs,
            items,
            discountAmount: discountAmount,
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

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="section-title text-neutral-900 dark:text-neutral-100 mb-8">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 1. Shipping Address */}
          <div className="surface-card rounded-2xl md:rounded-3xl p-6">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-sm font-bold">1</span>
              Shipping Address
            </h3>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-[var(--surface-border)]">
              <MapPin className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
              <div>
                {shippingAddress ? (
                  <>
                    {defaultAddress?.label && (
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-0.5">{defaultAddress.label}</p>
                    )}
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{shippingAddress}</p>
                  </>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No address saved. You can add one in your profile.</p>
                )}
                <Link href="/dashboard/addresses" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block">Change address</Link>
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500" />
              Usually ships in 3–5 business days
            </p>
          </div>

          {/* 2. Payment method */}
          <div className="surface-card rounded-2xl md:rounded-3xl p-6">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-sm font-bold">2</span>
              Payment Method
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod("paystack")}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === "paystack"
                    ? "border-primary-500 bg-primary-500/10 dark:bg-primary-500/20"
                    : "border-neutral-200 dark:border-[var(--surface-border)] hover:border-neutral-300 dark:hover:border-[var(--surface-border)]"
                }`}
              >
                <CreditCard className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <span className="text-neutral-900 dark:text-neutral-100">Paystack (GHS)</span>
              </button>
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === "stripe"
                    ? "border-primary-500 bg-primary-500/10 dark:bg-primary-500/20"
                    : "border-neutral-200 dark:border-[var(--surface-border)] hover:border-neutral-300 dark:hover:border-[var(--surface-border)]"
                }`}
              >
                <CreditCard className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <span className="text-neutral-900 dark:text-neutral-100">Stripe (USD)</span>
              </button>
              <button
                onClick={() => setPaymentMethod("wallet")}
                disabled={!canUseWallet}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === "wallet"
                    ? "border-primary-500 bg-primary-500/10 dark:bg-primary-500/20"
                    : "border-neutral-200 dark:border-[var(--surface-border)]"
                } ${!canUseWallet ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Wallet className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <span className="text-neutral-900 dark:text-neutral-100">
                  Wallet ({displayWallet})
                  {!canUseWallet && " – Insufficient balance"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* 3. Order summary */}
          <div className="surface-card rounded-2xl md:rounded-3xl p-6 lg:sticky lg:top-24 shadow-[var(--shadow-float)] dark:shadow-[var(--shadow-float)]">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-sm font-bold">3</span>
              Order Summary
            </h3>
            {!appliedCoupon ? (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Coupon code"
                  className="input-base pl-9 py-2.5 text-sm"
                />
              </div>
              <button onClick={applyCoupon} disabled={applying} className="btn-secondary px-4 py-2.5 text-sm whitespace-nowrap">
                {applying ? "..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{appliedCoupon.code} applied</span>
              <button onClick={removeCoupon} className="p-1 rounded hover:bg-primary-500/20"><X className="w-4 h-4" /></button>
            </div>
          )}
          {couponError && <p className="text-sm text-red-500 mb-2">{couponError}</p>}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Subtotal</span>
              <span>{displaySubtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary-600 dark:text-primary-400">
                <span>Discount</span>
                <span>-{displayDiscount}</span>
              </div>
            )}
            <motion.div
              key={totalInGhs}
              initial={{ opacity: 0.7, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-between font-semibold text-xl pt-3 border-t border-neutral-100 dark:border-[var(--surface-border)]"
            >
              <span className="text-neutral-900 dark:text-neutral-100">Total</span>
              <span className="text-primary-600 dark:text-primary-400">{displayTotal}</span>
            </motion.div>
          </div>
          <motion.button
            onClick={handleCheckout}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-4 rounded-xl"
          >
            {loading ? "Processing…" : "Place Order"}
          </motion.button>
          <div className="flex items-center justify-center gap-2 pt-3 text-xs text-neutral-500 dark:text-neutral-400">
            <Shield className="w-4 h-4 text-primary-500" />
            <span>Secure payment · Your data is protected</span>
          </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
