"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
        >
          Add Product
        </Link>
      </div>

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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Stock
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.stock}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
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
