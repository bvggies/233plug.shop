"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DISPLAY_CURRENCIES } from "@/store/currency-store";
import { Plus, Trash2, Package } from "lucide-react";
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  category_id: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or greater"),
  currency: z.enum(DISPLAY_CURRENCIES as unknown as [string, ...string[]]),
  sku: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export type NewVariantRow = {
  id: string;
  name: string;
  image_url: string;
  size: string;
  color: string;
  sku: string;
  price_adjustment: string;
  stock: string;
};

const emptyVariant = (): NewVariantRow => ({
  id: `v-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "",
  image_url: "",
  size: "",
  color: "",
  sku: "",
  price_adjustment: "0",
  stock: "0",
});

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagesInput, setImagesInput] = useState("");
  const [isTrending, setIsTrending] = useState(false);
  const [isHotDeal, setIsHotDeal] = useState(false);
  const [variants, setVariants] = useState<NewVariantRow[]>([]);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category_id: null,
      price: 0,
      stock: 0,
      currency: "GHS",
      sku: "",
    },
  });

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories((data as Category[]) || []));
  }, [supabase]);

  const addVariant = () => setVariants((v) => [...v, emptyVariant()]);
  const removeVariant = (id: string) => setVariants((v) => v.filter((x) => x.id !== id));
  const updateVariant = (id: string, field: keyof NewVariantRow, value: string) => {
    setVariants((v) => v.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const images = imagesInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const hasDiscount =
        (discountType === "percent" || discountType === "fixed") &&
        discountValue.trim() !== "" &&
        !isNaN(Number(discountValue)) &&
        Number(discountValue) > 0;
      const finalDiscountType = hasDiscount ? discountType : null;
      const finalDiscountVal = hasDiscount ? Number(discountValue) : null;

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id || null,
          price: data.price,
          stock: data.stock,
          currency: data.currency,
          sku: data.sku?.trim() || null,
          images,
          is_trending: isTrending,
          is_hot_deal: isHotDeal,
          discount_type: finalDiscountType,
          discount_value: finalDiscountVal,
        })
        .select("id")
        .single();

      if (productError || !product) throw productError;

      if (variants.length > 0) {
        const variantRows = variants.map((v) => ({
          product_id: product.id,
          name: v.name.trim() || null,
          image_url: v.image_url.trim() || null,
          size: v.size.trim() || null,
          color: v.color.trim() || null,
          sku: v.sku.trim() || null,
          price_adjustment: parseFloat(v.price_adjustment) || 0,
          stock: parseInt(v.stock, 10) || 0,
        }));
        const { error: variantsError } = await supabase.from("product_variants").insert(variantRows);
        if (variantsError) throw variantsError;
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Main product card */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                {...register("category_id")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                placeholder="Product description"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs (one per line)</label>
              <textarea
                value={imagesInput}
                onChange={(e) => setImagesInput(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none font-mono text-sm"
                placeholder="https://example.com/image1.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  {...register("price")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="0.00"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency (purchase price)</label>
                <select
                  {...register("currency")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                >
                  {DISPLAY_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-0.5">Customers see it converted to their selected currency.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                <input
                  {...register("stock")}
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="0"
                />
                {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU (optional)</label>
              <input
                {...register("sku")}
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Leave empty to auto-generate"
              />
              <p className="text-xs text-gray-500 mt-0.5">e.g. PERF-001, or leave blank for auto (SKU-000001…).</p>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="rounded border-gray-300 text-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Trending</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHotDeal}
                  onChange={(e) => setIsHotDeal(e.target.checked)}
                  className="rounded border-gray-300 text-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Hot Deal</span>
              </label>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Discount (optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "none" | "percent" | "fixed")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="none">No discount</option>
                    <option value="percent">Percent off</option>
                    <option value="fixed">Fixed amount off</option>
                  </select>
                </div>
                {(discountType === "percent" || discountType === "fixed") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {discountType === "percent" ? "Percent off (e.g. 20)" : "Amount off (in product currency)"}
                    </label>
                    <input
                      type="number"
                      step={discountType === "percent" ? 1 : 0.01}
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                      placeholder={discountType === "percent" ? "20" : "0.00"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Variants (optional) */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Variants (optional)
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition"
            >
              <Plus className="w-4 h-4" />
              Add variant
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Add size/color options or other variants. If you add none, customers buy the base product at the price above.
          </p>

          {variants.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No variants added. Click “Add variant” to add size, color, or other options.</p>
          ) : (
            <div className="space-y-4">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant</span>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                        placeholder="e.g. Large / Blue"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={v.image_url}
                        onChange={(e) => updateVariant(v.id, "image_url", e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Size</label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => updateVariant(v.id, "size", e.target.value)}
                        placeholder="e.g. M, 42"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => updateVariant(v.id, "color", e.target.value)}
                        placeholder="e.g. Black"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Price adjustment</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.price_adjustment}
                        onChange={(e) => updateVariant(v.id, "price_adjustment", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-0.5">Added to base price</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create product"}
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
