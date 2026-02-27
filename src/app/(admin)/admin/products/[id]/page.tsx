"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product, Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  category_id: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or greater"),
  sku: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function EditProductPage() {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagesInput, setImagesInput] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category_id: null,
      price: 0,
      stock: 0,
      sku: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from("products").select("*").eq("id", id).single(),
          supabase.from("categories").select("*").order("name"),
        ]);
        if (prodRes.error) throw prodRes.error;
        const p = prodRes.data as Product;
        setProduct(p);
        setCategories((catRes.data as Category[]) || []);
        reset({
          name: p.name,
          description: p.description || "",
          category_id: p.category_id || null,
          price: Number(p.price),
          stock: p.stock,
          sku: p.sku || "",
        });
        setImagesInput(Array.isArray(p.images) ? (p.images as string[]).join("\n") : "");
      } catch {
        toast.error("Product not found");
        router.push("/admin/products");
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [id, supabase, reset, router]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setLoading(true);
    try {
      const images = imagesInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id || null,
          price: data.price,
          stock: data.stock,
          sku: data.sku || null,
          images,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Product updated successfully");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct || !product) {
    return (
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit Product
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="Product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              {...register("category_id")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
              placeholder="Product description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URLs (one per line)
            </label>
            <textarea
              value={imagesInput}
              onChange={(e) => setImagesInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none font-mono text-sm"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (GHS)
              </label>
              <input
                {...register("price")}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock
              </label>
              <input
                {...register("stock")}
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              {...register("sku")}
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="e.g. PERF-001"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
