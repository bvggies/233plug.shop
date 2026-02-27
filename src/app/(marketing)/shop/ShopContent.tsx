"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Grid3X3,
  LayoutGrid,
  Search,
  Check,
  X,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { Product, Category } from "@/types";

type SortOption = "newest" | "price_asc" | "price_desc" | "name";

export function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category") ?? "";
  const selectedCategories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
  const searchQuery = searchParams.get("q") ?? "";
  const minPrice = searchParams.get("min") ? Number(searchParams.get("min")) : null;
  const maxPrice = searchParams.get("max") ? Number(searchParams.get("max")) : null;
  const inStockOnly = searchParams.get("stock") === "1";
  const sortParam = (searchParams.get("sort") as SortOption) || "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [searchParams, router]
  );

  const toggleCategory = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug];
    updateParams({ category: next.length ? next.join(",") : null });
  };

  const setSearch = (q: string) => {
    setLocalSearch(q);
    updateParams({ q: q.trim() || null });
  };

  const setPriceRange = (min: string, max: string) => {
    const mn = min ? min : null;
    const mx = max ? max : null;
    updateParams({
      min: mn,
      max: mx,
    });
  };

  const toggleInStock = () => {
    updateParams({ stock: inStockOnly ? null : "1" });
  };

  const setSort = (s: SortOption) => {
    updateParams({ sort: s === "newest" ? null : s });
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearch("");
    updateParams({
      category: null,
      min: null,
      max: null,
      stock: null,
      sort: null,
    });
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    searchQuery ||
    minPrice != null ||
    maxPrice != null ||
    inStockOnly;

  useEffect(() => {
    const supabase = createClient();
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories((data as Category[]) ?? []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("*, category:categories(*)");

      if (selectedCategories.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id")
          .in("slug", selectedCategories);
        const ids = (cats ?? []).map((c: { id: string }) => c.id);
        if (ids.length) query = query.in("category_id", ids);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (minPrice != null && !isNaN(minPrice)) {
        query = query.gte("price", minPrice);
      }
      if (maxPrice != null && !isNaN(maxPrice)) {
        query = query.lte("price", maxPrice);
      }
      if (inStockOnly) {
        query = query.gt("stock", 0);
      }

      query = query.order("created_at", { ascending: false });
      const { data } = await query;
      let list = (data as Product[]) ?? [];

      if (sortParam === "price_asc") list.sort((a, b) => a.price - b.price);
      else if (sortParam === "price_desc") list.sort((a, b) => b.price - a.price);
      else if (sortParam === "name") list.sort((a, b) => a.name.localeCompare(b.name));

      setProducts(list);
      setLoading(false);
    };
    fetchProducts();
  }, [
    selectedCategories.join(","),
    searchQuery,
    minPrice,
    maxPrice,
    inStockOnly,
    sortParam,
  ]);

  const Sidebar = () => (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="lg:sticky lg:top-24 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
          <div className="space-y-2">
            <label
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => selectedCategories.length > 0 && updateParams({ category: null })}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  selectedCategories.length === 0
                    ? "bg-primary-500 border-primary-500"
                    : "border-gray-300 group-hover:border-gray-400"
                }`}
              >
                {selectedCategories.length === 0 && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">All categories</span>
            </label>
            {categories.map((c) => {
              const checked = selectedCategories.includes(c.slug);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-3 cursor-pointer group py-1"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      checked ? "bg-primary-500 border-primary-500" : "border-gray-300 group-hover:border-gray-400"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleCategory(c.slug);
                    }}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.slug)}
                    className="sr-only"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{c.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Price range */}
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApply={setPriceRange}
        />

        {/* In stock only */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                inStockOnly ? "bg-primary-500 border-primary-500" : "border-gray-300 group-hover:border-gray-400"
              }`}
            >
              {inStockOnly && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={toggleInStock}
              className="sr-only"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">In stock only</span>
          </label>
        </div>

        {/* Sort */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort by</h3>
          <select
            value={sortParam}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl mx-4 md:mx-6 mb-8 md:mb-12 px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-2">
            {selectedCategories.length === 1
              ? categories.find((c) => c.slug === selectedCategories[0])?.name ?? "Shop"
              : "Shop"}
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            {selectedCategories.length === 1
              ? `Browse our curated selection of ${categories.find((c) => c.slug === selectedCategories[0])?.name?.toLowerCase() ?? ""}.`
              : "Explore perfumes, sneakers, electronics, accessories and more. Request items we don't stock."}
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {hasActiveFilters && `(${selectedCategories.length + (inStockOnly ? 1 : 0) + (searchQuery ? 1 : 0)})`}
            </button>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden"
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-soft">
              <Sidebar />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-6"
            >
              <p className="text-gray-500 text-sm">
                {loading ? "Loading..." : `${products.length} product${products.length !== 1 ? "s" : ""}`}
              </p>
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`p-2 rounded-lg transition ${viewMode === "compact" ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
                  aria-label="Compact view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {loading ? (
              <div
                className={`grid gap-4 md:gap-6 ${
                  viewMode === "compact"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                }`}
              >
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No products match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="inline-block px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
                >
                  Clear filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 md:gap-6 ${
                  viewMode === "compact"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={viewMode === "compact" ? "min-w-0" : ""}
                    >
                      <ProductCard
                        product={product}
                        compact={viewMode === "compact"}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRangeFilter({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice: number | null;
  maxPrice: number | null;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(minPrice != null ? String(minPrice) : "");
  const [max, setMax] = useState(maxPrice != null ? String(maxPrice) : "");

  useEffect(() => {
    setMin(minPrice != null ? String(minPrice) : "");
    setMax(maxPrice != null ? String(maxPrice) : "");
  }, [minPrice, maxPrice]);

  const handleBlur = () => onApply(min, max);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Price range (GHS)</h3>
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          step={1}
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="number"
          min={0}
          step={1}
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
