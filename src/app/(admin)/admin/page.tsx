"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShoppingBag,
  FileText,
  DollarSign,
  Package,
  Image as ImageIcon,
  Mail,
  Plus,
  ArrowRight,
  Users,
  Ticket,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { subDays, startOfDay } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from "recharts";

type Stats = {
  totalOrders: number;
  totalRequests: number;
  totalRevenue: number;
  totalProducts: number;
  heroSlides: number;
  contactSubmissions: number;
  totalUsers: number;
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

type RecentContact = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

type RecentUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: string;
};

type RevenueDay = { date: string; revenue: number; label: string };
type OrdersByStatusItem = { name: string; value: number; fill: string };
type ActivityDay = { date: string; orders: number; requests: number; label: string };
type TopProductItem = { name: string; quantity: number; productId: string };

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  reviewing: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
};

const CHART_COLORS = {
  revenue: "#059669",
  orders: "#2563eb",
  requests: "#d97706",
  pie: ["#2563eb", "#059669", "#0ea5e9", "#10b981", "#94a3b8", "#64748b"],
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [chartOrders, setChartOrders] = useState<{ status: string; total_price: number; created_at: string }[]>([]);
  const [paidOrders30, setPaidOrders30] = useState<{ created_at: string; total_price: number }[]>([]);
  const [chartRequests, setChartRequests] = useState<{ created_at: string }[]>([]);
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAll() {
      const thirtyDaysAgo = subDays(startOfDay(new Date()), 30).toISOString();
      const fourteenDaysAgo = subDays(startOfDay(new Date()), 14).toISOString();

      const [
        ordersRes,
        requestsRes,
        revenueRes,
        productsRes,
        heroRes,
        contactRes,
        usersRes,
        ordersData,
        requestsData,
        contactListRes,
        usersListRes,
        paidOrders30Res,
        recentOrdersForChartRes,
        recentRequestsRes,
        orderItemsRes,
        productsResList,
      ] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_price").eq("status", "paid"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("hero_slides").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, status, total_price, currency, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("requests").select("id, product_name, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("contact_submissions").select("id, name, email, subject, message, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("created_at, total_price").eq("status", "paid").gte("created_at", thirtyDaysAgo),
        supabase.from("orders").select("status, total_price, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("requests").select("created_at").gte("created_at", fourteenDaysAgo),
        supabase.from("order_items").select("product_id, quantity"),
        supabase.from("products").select("id, name"),
      ]);

      const totalRevenue = (revenueRes.data ?? []).reduce((s, o) => s + (o.total_price ?? 0), 0);
      setStats({
        totalOrders: ordersRes.count ?? 0,
        totalRequests: requestsRes.count ?? 0,
        totalRevenue,
        totalProducts: productsRes.count ?? 0,
        heroSlides: heroRes.count ?? 0,
        contactSubmissions: contactRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
      });
      setRecentOrders((ordersData.data as RecentOrder[]) ?? []);
      setRecentRequests((requestsData.data as RecentRequest[]) ?? []);
      setRecentContacts((contactListRes.data as RecentContact[]) ?? []);
      setRecentUsers((usersListRes.data as RecentUser[]) ?? []);
      setPaidOrders30((paidOrders30Res.data as { created_at: string; total_price: number }[]) ?? []);
      setChartOrders((recentOrdersForChartRes.data as { status: string; total_price: number; created_at: string }[]) ?? []);
      setChartRequests((recentRequestsRes.data as { created_at: string }[]) ?? []);
      setOrderItems((orderItemsRes.data as { product_id: string; quantity: number }[]) ?? []);
      const products = (productsResList.data as { id: string; name: string }[]) ?? [];
      setProductsMap(Object.fromEntries(products.map((p) => [p.id, p.name])));
      setLoading(false);
    }
    fetchAll();
  }, [supabase]);

  const revenueByDay = useMemo(() => {
    const days: RevenueDay[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = subDays(startOfDay(now), i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, revenue: 0, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) });
    }
    paidOrders30.forEach((o) => {
      const dateStr = o.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.revenue += Number(o.total_price);
    });
    return days;
  }, [paidOrders30]);

  const ordersByStatus = useMemo(() => {
    const count: Record<string, number> = {};
    chartOrders.forEach((o) => {
      count[o.status] = (count[o.status] ?? 0) + 1;
    });
    return Object.entries(count).map(([name, value], i) => ({
      name: ORDER_STATUS_LABELS[name] ?? name,
      value,
      fill: CHART_COLORS.pie[i % CHART_COLORS.pie.length],
    }));
  }, [chartOrders]);

  const activityByDay = useMemo(() => {
    const days: ActivityDay[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = subDays(startOfDay(now), i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        orders: 0,
        requests: 0,
        label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      });
    }
    chartOrders.forEach((o) => {
      const dateStr = o.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.orders += 1;
    });
    chartRequests.forEach((o) => {
      const dateStr = o.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.requests += 1;
    });
    return days;
  }, [chartOrders, chartRequests]);

  const topProducts = useMemo(() => {
    const byProduct: Record<string, number> = {};
    orderItems.forEach((item) => {
      byProduct[item.product_id] = (byProduct[item.product_id] ?? 0) + (item.quantity ?? 0);
    });
    return Object.entries(byProduct)
      .map(([productId, quantity]) => ({ productId, name: productsMap[productId] ?? "Unknown", quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orderItems, productsMap]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48 rounded mb-2" />
          <Skeleton className="h-5 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
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
      icon: ImageIcon,
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Contact form",
      value: stats?.contactSubmissions ?? 0,
      href: "/admin/contact",
      icon: Mail,
      color: "from-cyan-500 to-cyan-600",
      bgLight: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      label: "Users",
      value: stats?.totalUsers ?? 0,
      href: "/admin/users",
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      bgLight: "bg-indigo-50",
      iconColor: "text-indigo-600",
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

      {/* Stat cards - 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-800 hover:shadow-soft-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all flex flex-col min-h-[120px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bgLight} dark:bg-opacity-20 ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mt-2">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
        <h2 className="font-display font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add product
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <Users className="w-4 h-4" aria-hidden />
            Manage users
          </Link>
          <Link
            href="/admin/coupons"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <Ticket className="w-4 h-4" aria-hidden />
            Coupons
          </Link>
          <Link
            href="/admin/hero"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ImageIcon className="w-4 h-4" aria-hidden />
            Edit hero
          </Link>
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Edit pages
          </Link>
        </div>
      </div>

      {/* Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">Analytics</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue trend - last 30 days */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100">Revenue (last 30 days)</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Paid orders only</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} tickFormatter={(v) => `GHS ${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.label}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatPrice(d.revenue, "GHS")}</p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by status */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100">Orders by status</h3>
            </div>
            <div className="h-72">
              {ordersByStatus.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No orders in last 30 days</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={ordersByStatus[i].fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Orders"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--gray-200)" }}
                    />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders vs requests - last 14 days */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100 mb-6">Orders vs requests (last 14 days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--gray-200)" }}
                    labelStyle={{ color: "var(--gray-700)" }}
                  />
                  <Legend layout="horizontal" align="center" wrapperStyle={{ paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="orders" name="Orders" fill={CHART_COLORS.orders} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="requests" name="Requests" fill={CHART_COLORS.requests} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100 mb-6">Top products (units sold)</h3>
            <div className="h-72">
              {topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No order data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500" axisLine={false} tickLine={false} width={80} tickFormatter={(v) => (v.length > 14 ? v.slice(0, 14) + "…" : v)} />
                    <Tooltip
                      formatter={(value: number) => [value, "Units"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--gray-200)" }}
                    />
                    <Bar dataKey="quantity" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={24} name="Units" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 dark:text-gray-100">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No orders yet</div>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href="/admin/orders"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatPrice(o.total_price, o.currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(o.created_at)}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      statusColors[o.status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {o.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 dark:text-gray-100">Recent requests</h2>
            <Link
              href="/admin/requests"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentRequests.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No requests yet</div>
            ) : (
              recentRequests.map((r) => (
                <Link
                  key={r.id}
                  href="/admin/requests"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{r.product_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.created_at)}</p>
                  </div>
                  <span
                    className={`ml-4 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                      statusColors[r.status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 dark:text-gray-100">Recent signups</h2>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No users yet</div>
            ) : (
              recentUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.name || u.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="ml-4 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 flex-shrink-0 capitalize">
                    {u.role.replace("_", " ")}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent contact form submissions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden lg:col-span-3">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 dark:text-gray-100">Recent contact form messages</h2>
            <Link
              href="/admin/contact"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentContacts.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No messages yet</div>
            ) : (
              recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href="/admin/contact"
                  className="flex flex-col gap-1 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{formatDate(c.created_at)}</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{c.subject ?? c.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
