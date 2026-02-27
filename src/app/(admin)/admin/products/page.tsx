"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Plus, Search, Pencil } from "lucide-react";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        setProducts((data as Product[]) || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

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
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add product
          </Link>
        }
      />

      {products.length > 0 && (
        <div className="mb-4">
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
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          <p>No products yet.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block text-primary-500 hover:underline"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatPrice(p.price, p.currency)}
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
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && search && (
            <div className="px-6 py-12 text-center text-gray-500">No products match &quot;{search}&quot;</div>
          )}
        </div>
      )}
    </div>
  );
}
