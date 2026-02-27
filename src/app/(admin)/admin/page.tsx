"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

type Stats = {
  totalOrders: number;
  totalRequests: number;
  totalRevenue: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, requestsRes, revenueRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("total_price, currency")
          .eq("status", "paid"),
      ]);

      const totalOrders = ordersRes.count ?? 0;
      const totalRequests = requestsRes.count ?? 0;
      const totalRevenue =
        (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total_price ?? 0), 0) || 0;

      setStats({
        totalOrders,
        totalRequests,
        totalRevenue,
      });
      setLoading(false);
    };
    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      href: "/admin/orders",
    },
    {
      label: "Total Requests",
      value: stats?.totalRequests ?? 0,
      href: "/admin/requests",
    },
    {
      label: "Total Revenue (Paid)",
      value: formatPrice(stats?.totalRevenue ?? 0, "GHS"),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
        Admin Overview
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
          >
            <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-display font-bold text-gray-900">
              {card.value}
            </p>
            {card.href && (
              <a
                href={card.href}
                className="mt-2 inline-block text-sm text-primary-500 hover:underline"
              >
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
