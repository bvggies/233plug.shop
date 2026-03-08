"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { ChevronLeft, Package, Truck, Receipt } from "lucide-react";
import type { Order, OrderStatus, ShipmentBatch, ShipmentTrackingEvent } from "@/types";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
};

export default function DashboardOrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;
  const [order, setOrder] = useState<(Order & { order_items?: { product_id: string; quantity: number; price: number; product?: { name: string } }[] }) | null>(null);
  const [batch, setBatch] = useState<ShipmentBatch | null>(null);
  const [events, setEvents] = useState<ShipmentTrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*, order_items(*, product:products(name))")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();
        if (orderError || !orderData) {
          setOrder(null);
          setLoading(false);
          return;
        }
        setOrder(orderData as typeof order);
        const batchId = (orderData as Order).shipment_batch_id;
        if (batchId) {
          const [{ data: batchData }, { data: eventsData }] = await Promise.all([
            supabase.from("shipment_batches").select("*").eq("id", batchId).single(),
            supabase.from("shipment_tracking_events").select("*").eq("shipment_batch_id", batchId).order("created_at", { ascending: true }),
          ]);
          setBatch(batchData as ShipmentBatch | null);
          setEvents((eventsData as ShipmentTrackingEvent[]) ?? []);
        } else {
          setBatch(null);
          setEvents([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, supabase]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">Order not found.</p>
        <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const status = order.status as OrderStatus;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span
            className={cn(
              "inline-flex px-3 py-1.5 rounded-xl text-sm font-medium capitalize",
              statusColors[status]
            )}
          >
            {status}
          </span>
          <div className="flex items-center gap-3">
            {["paid", "shipped", "delivered"].includes(status) && (
              <Link
                href={`/dashboard/orders/${order.id}/receipt`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary-500 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-500/10 dark:hover:bg-primary-500/20 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                View receipt
              </Link>
            )}
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatPrice(order.total_price, order.currency)}
            </p>
          </div>
        </div>
        {order.order_items && order.order_items.length > 0 && (
          <ul className="border-t border-neutral-100 dark:border-[var(--surface-border)] pt-4 space-y-2">
            {order.order_items.map((item: { product_id: string; quantity: number; price: number; product?: { name: string } }) => (
              <li key={item.product_id} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">
                  {(item as { product?: { name: string } }).product?.name ?? "Item"} × {item.quantity}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatPrice(item.price * item.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {batch ? (
        <div className="surface-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            <Truck className="w-5 h-5 text-primary-500" />
            Tracking
          </h2>
          <TrackingTimeline batch={batch} events={events} showBatchInfo={true} />
        </div>
      ) : (
        <div className="surface-card rounded-2xl p-6 flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="font-medium text-neutral-900 dark:text-neutral-100">No shipment assigned yet</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            This order has not been assigned to a shipment batch. You will see tracking here once it has been shipped.
          </p>
        </div>
      )}
    </div>
  );
}
