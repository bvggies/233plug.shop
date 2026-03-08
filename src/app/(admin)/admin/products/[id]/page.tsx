"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import type { Product, Category, ProductVariant } from "@/types";
import { DISPLAY_CURRENCIES } from "@/store/currency-store";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  category_id: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or greater"),
  sku: z.string().optional().nullable(),
  currency: z.enum(DISPLAY_CURRENCIES as unknown as [string, ...string[]]),
});

type FormData = z.infer<typeof schema>;

export default function EditProductPage() {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [imagesInput, setImagesInput] = useState("");
  const [isTrending, setIsTrending] = useState(false);
  const [isHotDeal, setIsHotDeal] = useState(false);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [variantForm, setVariantForm] = useState({
    name: "",
    image_url: "",
    size: "",
    color: "",
    sku: "",
    price_adjustment: "0",
    stock: "0",
  });

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
      currency: "GHS",
    },
  });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [prodRes, catRes, varRes] = await Promise.all([
          supabase.from("products").select("*").eq("id", id).single(),
          supabase.from("categories").select("*").order("name"),
          supabase.from("product_variants").select("*").eq("product_id", id).order("id"),
        ]);
        if (prodRes.error) throw prodRes.error;
        const p = prodRes.data as Product;
        setProduct(p);
        setCategories((catRes.data as Category[]) || []);
        setVariants((varRes.data as ProductVariant[]) ?? []);
        reset({
          name: p.name,
          description: p.description || "",
          category_id: p.category_id || null,
          price: Number(p.price),
          stock: p.stock,
          sku: p.sku || "",
          currency: (p.currency ?? "GHS") as "GHS" | "USD" | "NGN" | "EUR" | "GBP",
        });
        setImagesInput(Array.isArray(p.images) ? (p.images as string[]).join("\n") : "");
        setIsTrending(!!(p as Product & { is_trending?: boolean }).is_trending);
        setIsHotDeal(!!(p as Product & { is_hot_deal?: boolean }).is_hot_deal);
        const dt = (p as Product & { discount_type?: string | null }).discount_type;
        const dv = (p as Product & { discount_value?: number | null }).discount_value;
        setDiscountType(dt === "percent" || dt === "fixed" ? dt : "none");
        setDiscountValue(dv != null && dv > 0 ? String(dv) : "");
      } catch {
        toast.error("Product not found");
        router.push("/admin/products");
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [id, supabase, reset, router]);

  const loadVariants = async () => {
    if (!id) return;
    const { data } = await supabase.from("product_variants").select("*").eq("product_id", id).order("id");
    setVariants((data as ProductVariant[]) ?? []);
  };

  const openAddVariant = () => {
    setEditingVariantId(null);
    setVariantForm({ name: "", image_url: "", size: "", color: "", sku: "", price_adjustment: "0", stock: "0" });
    setShowVariantForm(true);
  };

  const openEditVariant = (v: ProductVariant) => {
    setEditingVariantId(v.id);
    setVariantForm({
      name: v.name ?? "",
      image_url: v.image_url ?? "",
      size: v.size ?? "",
      color: v.color ?? "",
      sku: v.sku ?? "",
      price_adjustment: String(v.price_adjustment ?? 0),
      stock: String(v.stock ?? 0),
    });
    setShowVariantForm(true);
  };

  const saveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setVariantSaving(true);
    try {
      const payload = {
        product_id: id,
        name: variantForm.name.trim() || null,
        image_url: variantForm.image_url.trim() || null,
        size: variantForm.size.trim() || null,
        color: variantForm.color.trim() || null,
        sku: variantForm.sku.trim() || null,
        price_adjustment: parseFloat(variantForm.price_adjustment) || 0,
        stock: parseInt(variantForm.stock, 10) || 0,
      };
      if (editingVariantId) {
        const { error } = await supabase.from("product_variants").update(payload).eq("id", editingVariantId);
        if (error) throw error;
        toast.success("Variant updated");
      } else {
        const { error } = await supabase.from("product_variants").insert(payload);
        if (error) throw error;
        toast.success("Variant added");
      }
      setShowVariantForm(false);
      setEditingVariantId(null);
      loadVariants();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save variant");
    } finally {
      setVariantSaving(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Delete this variant?")) return;
    try {
      const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
      if (error) throw error;
      toast.success("Variant deleted");
      loadVariants();
      if (editingVariantId === variantId) {
        setShowVariantForm(false);
        setEditingVariantId(null);
      }
    } catch {
      toast.error("Failed to delete variant");
    }
  };

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
          is_trending: isTrending,
          is_hot_deal: isHotDeal,
          currency: data.currency,
          discount_type:
            (discountType === "percent" || discountType === "fixed") &&
            discountValue.trim() !== "" &&
            !isNaN(Number(discountValue)) &&
            Number(discountValue) > 0
              ? discountType
              : null,
          discount_value:
            (discountType === "percent" || discountType === "fixed") &&
            discountValue.trim() !== "" &&
            !isNaN(Number(discountValue)) &&
            Number(discountValue) > 0
              ? Number(discountValue)
              : null,
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
                Price
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
                Currency (purchase price)
              </label>
              <select
                {...register("currency")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                {DISPLAY_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">Customers see prices converted to their selected currency.</p>
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
            <p className="text-xs text-gray-500 mt-0.5">Leave empty to auto-generate (e.g. SKU-000001).</p>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="rounded border-gray-300 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">Trending</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isHotDeal} onChange={(e) => setIsHotDeal(e.target.checked)} className="rounded border-gray-300 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">Hot Deal</span>
            </label>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Discount (optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "none" | "percent" | "fixed")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                >
                  <option value="none">No discount</option>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              {(discountType === "percent" || discountType === "fixed") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountType === "percent" ? "Percent off" : "Amount off (product currency)"}
                  </label>
                  <input
                    type="number"
                    step={discountType === "percent" ? 1 : 0.01}
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder={discountType === "percent" ? "20" : "0.00"}
                  />
                </div>
              )}
            </div>
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

      {/* Variants (optional) */}
      <div className="mt-10 bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Variants (optional)
          </h2>
          {!showVariantForm && (
            <button
              type="button"
              onClick={openAddVariant}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition"
            >
              <Plus className="w-4 h-4" />
              Add variant
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Add variants if this product comes in different sizes, colors, or options. If there are no variants, customers buy the base product.
        </p>

        {showVariantForm && (
          <form onSubmit={saveVariant} className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Large / Blue"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={variantForm.image_url}
                  onChange={(e) => setVariantForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Size</label>
                <input
                  type="text"
                  value={variantForm.size}
                  onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))}
                  placeholder="e.g. M, 42"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
                <input
                  type="text"
                  value={variantForm.color}
                  onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="e.g. Black"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SKU</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. SKU-001-M"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Price adjustment (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={variantForm.price_adjustment}
                  onChange={(e) => setVariantForm((f) => ({ ...f, price_adjustment: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Added to base price. Use 0 for same price.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={variantSaving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
                {variantSaving ? "Saving..." : editingVariantId ? "Update variant" : "Add variant"}
              </button>
              <button type="button" onClick={() => { setShowVariantForm(false); setEditingVariantId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {variants.length === 0 && !showVariantForm ? (
          <p className="text-sm text-gray-500 py-4">No variants. Customers will buy this product at the base price and stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Image</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Size / Color</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">SKU</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Price adj.</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Stock</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-2">
                      {v.image_url ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image src={v.image_url} alt={v.name ?? ""} fill className="object-cover" sizes="48px" unoptimized={v.image_url.startsWith("http")} />
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{v.name || "—"}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                      {[v.size, v.color].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{v.sku || "—"}</td>
                    <td className="py-3 px-2">{formatPrice(v.price_adjustment, product?.currency ?? "GHS")}</td>
                    <td className="py-3 px-2">{v.stock}</td>
                    <td className="py-3 px-2 text-right">
                      <button type="button" onClick={() => openEditVariant(v)} className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 rounded-lg" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => deleteVariant(v.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg ml-1" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
