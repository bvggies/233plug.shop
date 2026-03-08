"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Package } from "lucide-react";

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_price: number;
  currency: string;
  created_at: string;
  shipping_zone_id: string | null;
  shipping_zone?: { id: string; name: string } | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product?: { name: string } | null;
  variant?: { name: string | null; size: string | null; color: string | null } | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("paid");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItemRow[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [updatingZoneOrderId, setUpdatingZoneOrderId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadZones() {
      const { data } = await supabase
        .from("shipping_zones")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      setZones((data as { id: string; name: string }[]) ?? []);
    }
    loadZones();
  }, [supabase]);

  useEffect(() => {
    async function load() {
      let q = supabase
        .from("orders")
        .select("id, user_id, status, total_price, currency, created_at, shipping_zone_id, shipping_zone:shipping_zones(id, name)")
        .order("created_at", { ascending: false });
      if (zoneFilter) q = q.eq("shipping_zone_id", zoneFilter);
      const { data } = await q;
      setOrders((data as unknown as OrderRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, zoneFilter]);

  const reloadOrders = () => {
    let q = supabase
      .from("orders")
      .select("id, user_id, status, total_price, currency, created_at, shipping_zone_id, shipping_zone:shipping_zones(id, name)")
      .order("created_at", { ascending: false });
    if (zoneFilter) q = q.eq("shipping_zone_id", zoneFilter);
    q.then(({ data }) => setOrders((data as unknown as OrderRow[]) ?? []));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map((o) => o.id)));
  };

  const toggleExpanded = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (orderItemsMap[orderId]) return;
    setLoadingItems((prev) => new Set(prev).add(orderId));
    try {
      const { data } = await supabase
        .from("order_items")
        .select("id, product_id, variant_id, quantity, price, product:products(name), variant:product_variants(name, size, color)")
        .eq("order_id", orderId);
      const items = (data ?? []).map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id,
          product_id: r.product_id,
          variant_id: r.variant_id,
          quantity: r.quantity,
          price: r.price,
          product: r.product as { name: string } | null,
          variant: r.variant as { name: string | null; size: string | null; color: string | null } | null,
        };
      });
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items as OrderItemRow[] }));
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const updateOrderZone = async (orderId: string, zoneId: string | null) => {
    setUpdatingZoneOrderId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ shipping_zone_id: zoneId || null }).eq("id", orderId);
      if (error) throw error;
      toast.success("Shipping zone updated");
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const zone = zoneId ? zones.find((z) => z.id === zoneId) : null;
          return { ...ord, shipping_zone_id: zoneId || null, shipping_zone: zone ? { id: zone.id, name: zone.name } : null };
        })
      );
    } catch {
      toast.error("Failed to update zone");
    } finally {
      setUpdatingZoneOrderId(null);
    }
  };
  const variantLabel = (item: OrderItemRow) => {
    if (!item.variant) return null;
    const v = item.variant;
    if (v.name) return v.name;
    const parts = [v.size, v.color].filter(Boolean);
    return parts.length ? parts.join(" / ") : null;
  };

  const bulkUpdateStatus = async () => {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("orders").update({ status: bulkStatus }).in("id", ids);
      if (error) throw error;
      const affected = orders.filter((o) => ids.includes(o.id));
      const userIds = Array.from(new Set(affected.map((o) => o.user_id)));
      for (const uid of userIds) {
        await supabase.from("notifications").insert({
          user_id: uid,
          type: "request_status",
          message: `Your order(s) have been updated to ${bulkStatus}.`,
        });
      }
      toast.success(`${ids.length} order(s) updated to ${bulkStatus}`);
      setSelectedIds(new Set());
      reloadOrders();
    } catch {
      toast.error("Failed to update orders");
    } finally {
      setBulkApplying(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <label htmlFor="zone-filter" className="text-sm text-gray-600 dark:text-gray-400">Zone:</label>
          <select
            id="zone-filter"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-primary-50 border border-primary-200 flex flex-wrap items-center gap-3">
          <span className="font-medium text-primary-800">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-primary-200 bg-white text-gray-900 text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={bulkUpdateStatus}
            disabled={bulkApplying}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {bulkApplying ? "Updating…" : "Update status"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear selection
          </button>
        </div>
      )}

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
                  <th className="w-10 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="w-10 px-2 py-4" aria-label="Expand" />
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Zone</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr
                      className={cn("border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition", selectedIds.has(o.id) && "bg-primary-50/50")}
                    >
                      <td className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={() => toggleOne(o.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="w-10 px-2 py-4">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(o.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                          aria-label={expandedOrderId === o.id ? "Collapse" : "View items"}
                        >
                          {expandedOrderId === o.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
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
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {o.shipping_zone?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatPrice(o.total_price, o.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr key={`${o.id}-items`} className="bg-gray-50/80 dark:bg-gray-900/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping zone:</span>
                            <select
                              value={o.shipping_zone_id ?? ""}
                              onChange={(e) => updateOrderZone(o.id, e.target.value || null)}
                              disabled={updatingZoneOrderId === o.id}
                              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                            >
                              <option value="">No zone</option>
                              {zones.map((z) => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                              ))}
                            </select>
                            {updatingZoneOrderId === o.id && <span className="text-xs text-gray-500">Saving…</span>}
                          </div>
                          {loadingItems.has(o.id) ? (
                            <p className="text-sm text-gray-500">Loading items...</p>
                          ) : (orderItemsMap[o.id]?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-500">No items.</p>
                          ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Variant</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Qty</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderItemsMap[o.id].map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                                        {item.product?.name ?? "Product"}
                                      </td>
                                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                        {variantLabel(item) ? (
                                          <span className="inline-flex items-center gap-1">
                                            <Package className="w-3.5 h-3.5" />
                                            {variantLabel(item)}
                                          </span>
                                        ) : (
                                          "—"
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                                      <td className="py-3 px-4 text-right font-medium">{formatPrice(item.price * item.quantity, o.currency)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

