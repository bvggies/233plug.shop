"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/types";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize",
        statusColors[status]
      )}
    >
      {status}
    </span>
  );
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data, error } = await supabase.from("orders").select("*, shipment_batches(*)").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!error) setOrders((data as Order[]) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
        Orders
      </h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Order ID
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const batch = (order as Order & { shipment_batches?: { batch_name: string; status: string; tracking_number: string | null; estimated_delivery: string | null } | null } | null)?.shipment_batches ?? null;
                  const progress = batch ? (batch.status === "delivered" ? 100 : batch.status === "shipped" ? 66 : batch.status === "pending" ? 33 : 33) : 0;
                  return (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">{order.id.slice(0, 8)}...</div>
                      {batch && (
                        <div className="mt-1">
                          <div className="flex h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all", progress >= 66 ? "bg-indigo-500" : "bg-amber-500")} style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{batch.batch_name} · {batch.status}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(order.total_price, order.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
