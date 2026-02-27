"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  total_price: number;
  currency: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_price, currency, created_at")
        .order("created_at", { ascending: false });
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        {o.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                          statusColors[o.status] ?? "bg-gray-100 text-gray-700"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatPrice(o.total_price, o.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

