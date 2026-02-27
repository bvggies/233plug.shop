"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShoppingBag,
  FileText,
  DollarSign,
  Package,
  Image,
  Mail,
  Plus,
  ArrowRight,
} from "lucide-react";

type Stats = {
  totalOrders: number;
  totalRequests: number;
  totalRevenue: number;
  totalProducts: number;
  heroSlides: number;
  contactSubmissions: number;
};

type RecentOrder = {
  id: string;
  status: string;
  total_price: number;
  currency: string;
  created_at: string;
};

type RecentRequest = {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  reviewing: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAll() {
      const [
        ordersRes,
        requestsRes,
        revenueRes,
        productsRes,
        heroRes,
        contactRes,
        ordersData,
        requestsData,
      ] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_price").eq("status", "paid"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("hero_slides").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, status, total_price, currency, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("requests").select("id, product_name, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalRevenue = (revenueRes.data ?? []).reduce((s, o) => s + (o.total_price ?? 0), 0);
      setStats({
        totalOrders: ordersRes.count ?? 0,
        totalRequests: requestsRes.count ?? 0,
        totalRevenue,
        totalProducts: productsRes.count ?? 0,
        heroSlides: heroRes.count ?? 0,
        contactSubmissions: contactRes.count ?? 0,
      });
      setRecentOrders((ordersData.data as RecentOrder[]) ?? []);
      setRecentRequests((requestsData.data as RecentRequest[]) ?? []);
      setLoading(false);
    }
    fetchAll();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48 rounded mb-2" />
          <Skeleton className="h-5 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Orders",
      value: stats?.totalOrders ?? 0,
      href: "/admin/orders",
      icon: ShoppingBag,
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Requests",
      value: stats?.totalRequests ?? 0,
      href: "/admin/requests",
      icon: FileText,
      color: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Revenue",
      value: formatPrice(stats?.totalRevenue ?? 0, "GHS"),
      href: "/admin/orders",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      bgLight: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Products",
      value: stats?.totalProducts ?? 0,
      href: "/admin/products",
      icon: Package,
      color: "from-primary-500 to-primary-600",
      bgLight: "bg-primary-50",
      iconColor: "text-primary-600",
    },
    {
      label: "Hero Slides",
      value: stats?.heroSlides ?? 0,
      href: "/admin/hero",
      icon: Image,
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Contact",
      value: stats?.contactSubmissions ?? 0,
      href: "/admin/contact",
      icon: Mail,
      color: "from-cyan-500 to-cyan-600",
      bgLight: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-2xl p-5 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:border-gray-200 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bgLight} ${card.iconColor} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add product
          </Link>
          <Link
            href="/admin/hero"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            <Image className="w-4 h-4" />
            Edit hero
          </Link>
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Edit pages
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No orders yet</div>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href="/admin/orders"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatPrice(o.total_price, o.currency)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      statusColors[o.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Recent requests</h2>
            <Link
              href="/admin/requests"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRequests.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No requests yet</div>
            ) : (
              recentRequests.map((r) => (
                <Link
                  key={r.id}
                  href="/admin/requests"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{r.product_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(r.created_at)}</p>
                  </div>
                  <span
                    className={`ml-4 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                      statusColors[r.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
