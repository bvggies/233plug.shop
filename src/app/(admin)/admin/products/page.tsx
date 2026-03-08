"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductEffectivePrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Plus, Search, Pencil, Percent, Tag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDiscountType, setBulkDiscountType] = useState<"percent" | "fixed">("percent");
  const [bulkDiscountValue, setBulkDiscountValue] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [clearDiscount, setClearDiscount] = useState(false);
  const supabase = createClient();

  const load = useCallback(() => {
    setLoading(true);
    supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setProducts((data as Product[]) || []);
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const openBulkModal = () => {
    setBulkDiscountType("percent");
    setBulkDiscountValue("");
    setClearDiscount(false);
    setBulkModalOpen(true);
  };

  const applyBulkDiscount = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const payload = clearDiscount
        ? { discount_type: null, discount_value: null }
        : {
            discount_type: bulkDiscountType,
            discount_value:
              bulkDiscountType === "percent"
                ? Math.min(100, Math.max(0, Number(bulkDiscountValue)))
                : Math.max(0, Number(bulkDiscountValue)),
          };
      if (!clearDiscount && (bulkDiscountValue === "" || isNaN(Number(bulkDiscountValue)) || Number(bulkDiscountValue) <= 0)) {
        toast.error("Enter a valid discount value");
        setBulkSaving(false);
        return;
      }
      const { error } = await supabase.from("products").update(payload).in("id", Array.from(selectedIds));
      if (error) throw error;
      toast.success(clearDiscount ? `Discount cleared on ${selectedIds.size} product(s)` : `Discount applied to ${selectedIds.size} product(s)`);
      setSelectedIds(new Set());
      setBulkModalOpen(false);
      load();
    } catch {
      toast.error("Failed to update products");
    } finally {
      setBulkSaving(false);
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
      <AdminPageHeader
        title="Products"
        description={`${products.length} product${products.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={openBulkModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition"
              >
                <Percent className="w-4 h-4" />
                Bulk discount ({selectedIds.size})
              </button>
            )}
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
            >
              <Plus className="w-4 h-4" />
              Add product
            </Link>
          </div>
        }
      />

      {products.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          <p>No products yet.</p>
          <Link href="/admin/products/new" className="mt-4 inline-block text-primary-500 hover:underline">
            Add your first product
          </Link>
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
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-500"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Discount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const effective = getProductEffectivePrice(p.price, p.discount_type ?? null, p.discount_value ?? null);
                  const hasDiscount = effective < p.price;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300 text-primary-500"
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {hasDiscount ? (
                          <span>
                            <span className="line-through text-gray-400">{formatPrice(p.price, p.currency)}</span>{" "}
                            <span className="font-semibold text-gray-900">{formatPrice(effective, p.currency)}</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-900">{formatPrice(p.price, p.currency)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {p.discount_type && p.discount_value != null ? (
                          p.discount_type === "percent" ? (
                            <span>{p.discount_value}% off</span>
                          ) : (
                            <span>{formatPrice(p.discount_value, p.currency)} off</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${p.stock < 5 ? "text-amber-600 font-medium" : "text-gray-600"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && search && (
            <div className="px-6 py-12 text-center text-gray-500">No products match &quot;{search}&quot;</div>
          )}
        </div>
      )}

      {/* Bulk discount modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !bulkSaving && setBulkModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              Bulk discount
            </h3>
            <p className="text-sm text-gray-500 mb-4">Apply to {selectedIds.size} selected product(s).</p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={clearDiscount}
                onChange={(e) => setClearDiscount(e.target.checked)}
                className="rounded border-gray-300 text-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Clear discount instead (remove discount from selected)</span>
            </label>
            {!clearDiscount && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={bulkDiscountType}
                    onChange={(e) => setBulkDiscountType(e.target.value as "percent" | "fixed")}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  >
                    <option value="percent">Percent off</option>
                    <option value="fixed">Fixed amount off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {bulkDiscountType === "percent" ? "Percent (e.g. 20)" : "Amount off"}
                  </label>
                  <input
                    type="number"
                    step={bulkDiscountType === "percent" ? 1 : 0.01}
                    min="0"
                    value={bulkDiscountValue}
                    onChange={(e) => setBulkDiscountValue(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                    placeholder={bulkDiscountType === "percent" ? "20" : "0.00"}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !bulkSaving && setBulkModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulkDiscount}
                disabled={bulkSaving || (!clearDiscount && (bulkDiscountValue === "" || isNaN(Number(bulkDiscountValue)) || Number(bulkDiscountValue) <= 0))}
                className="px-4 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50"
              >
                {bulkSaving ? "Applying..." : clearDiscount ? "Clear discount" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
