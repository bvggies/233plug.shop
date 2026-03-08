"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderReceipt } from "@/components/receipt/OrderReceipt";
import { ChevronLeft } from "lucide-react";

type OrderRow = {
  id: string;
  status: string;
  total_price: number;
  currency: string;
  discount_amount: number | null;
  created_at: string;
  tracking_code: string | null;
};

type OrderItemRow = {
  id: string;
  quantity: number;
  price: number;
  product?: { name: string } | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
};

export default function OrderReceiptPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [customer, setCustomer] = useState<{ name: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      setForbidden(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setForbidden(true);
          return;
        }
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, status, total_price, currency, discount_amount, created_at, tracking_code")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();
        if (orderError || !orderData) {
          setOrder(null);
          setForbidden(!orderData);
          setLoading(false);
          return;
        }
        setOrder(orderData as OrderRow);
        const paidOrLater = ["paid", "shipped", "delivered"].includes((orderData as OrderRow).status);
        const [{ data: itemsData }, { data: paymentData }, { data: profileData }] = await Promise.all([
          supabase
            .from("order_items")
            .select("id, quantity, price, product:products(name)")
            .eq("order_id", orderId),
          paidOrLater
            ? supabase
                .from("payments")
                .select("id, amount, currency, payment_method, transaction_id, status, created_at")
                .eq("order_id", orderId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from("profiles")
            .select("name, email")
            .eq("id", user.id)
            .single(),
        ]);
        setItems((itemsData as unknown as OrderItemRow[]) ?? []);
        setPayment((paymentData as PaymentRow | null) ?? null);
        setCustomer(profileData ? { name: (profileData as { name: string | null }).name, email: (profileData as { email: string }).email } : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, supabase]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (forbidden || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">Receipt not found or you don’t have access.</p>
        <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const paidOrLater = ["paid", "shipped", "delivered"].includes(order.status);
  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <h1 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
          Receipt #{order.id.slice(0, 8).toUpperCase()}
        </h1>
      </div>
      {!paidOrLater && (
        <p className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
          Payment pending. This receipt will show payment details after your order is paid.
        </p>
      )}
      <OrderReceipt
        order={order}
        items={items}
        payment={payment}
        customer={customer}
        showPrintButton={true}
      />
    </div>
  );
}
