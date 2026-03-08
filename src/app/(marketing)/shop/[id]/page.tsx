"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  ArrowLeft,
  Truck,
  Shield,
  Share2,
  Package,
  ChevronRight,
  Minus,
  Plus,
  Star,
  BadgeCheck,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { formatDate, getProductEffectivePrice } from "@/lib/utils";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<{ id: string; user_id: string; rating: number; comment: string | null; order_id: string | null; created_at: string }[]>([]);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest">("newest");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [myReview, setMyReview] = useState<{ id: string; rating: number; comment: string | null; order_id: string | null; created_at: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<{ id: string; size: string | null; color: string | null; price_adjustment: number; stock: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "shipping" | "reviews">("description");
  const supabase = createClient();
  const addItem = useCartStore((s) => s.addItem);
  const basePriceForHook = product
    ? (selectedVariant ? product.price + (selectedVariant.price_adjustment ?? 0) : product.price)
    : 0;
  const effectivePriceForHook =
    product && basePriceForHook > 0
      ? getProductEffectivePrice(basePriceForHook, product.discount_type ?? null, product.discount_value ?? null)
      : 0;
  const productPriceDisplay = useDisplayPrice(effectivePriceForHook, product?.currency ?? "GHS");
  const hasDiscount = product && effectivePriceForHook < basePriceForHook;
  const productOriginalPriceDisplay = useDisplayPrice(basePriceForHook, product?.currency ?? "GHS");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("products")
          .select("*, category:categories(*), variants:product_variants(*)")
          .eq("id", id)
          .single();
        setProduct(data as Product);

        if (data?.category_id) {
          const { data: relatedData } = await supabase
            .from("products")
            .select("*, category:categories(*)")
            .eq("category_id", data.category_id)
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(4);
          setRelated((relatedData as Product[]) ?? []);
        }
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("id, user_id, rating, comment, order_id, created_at")
          .eq("product_id", id)
          .order("created_at", { ascending: false });
        setReviews((reviewData ?? []) as typeof reviews);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser ? { id: authUser.id } : null);
        if (authUser) {
          const { data: myRev } = await supabase
            .from("reviews")
            .select("id, rating, comment, order_id, created_at")
            .eq("product_id", id)
            .eq("user_id", authUser.id)
            .maybeSingle();
          setMyReview(myRev as typeof myReview);
          const { data: w } = await supabase.from("wishlists").select("id").eq("user_id", authUser.id).eq("product_id", id).single();
          setInWishlist(!!w);
        } else {
          setMyReview(null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, supabase]);

  const handleAddToCart = () => {
    if (!product) return;
    if (variants.length > 0 && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    if (displayStock === 0) {
      toast.error("Out of stock");
      return;
    }
    const qty = Math.min(quantity, displayStock);
    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      quantity: qty,
      price: displayPrice,
      product,
    });
    toast.success(`Added ${qty} to cart`);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Sign in to save items");
      return;
    }
    if (inWishlist) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product!.id);
      setInWishlist(false);
      toast.success("Removed from wishlist");
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: product!.id });
      setInWishlist(true);
      toast.success("Added to wishlist");
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: product?.name,
          url: window.location.href,
        });
        toast.success("Link copied!");
      } catch {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const loadReviews = async () => {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id, user_id, rating, comment, order_id, created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false });
    setReviews((reviewData ?? []) as typeof reviews);
    if (user) {
      const { data: myRev } = await supabase
        .from("reviews")
        .select("id, rating, comment, order_id, created_at")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyReview(myRev as typeof myReview);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating");
      return;
    }
    setReviewSubmitting(true);
    try {
      let orderId: string | null = null;
      const { data: orderRow } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("product_id", id)
        .limit(1)
        .maybeSingle();
      if (orderRow) {
        const { data: ord } = await supabase.from("orders").select("id").eq("id", (orderRow as { order_id: string }).order_id).eq("user_id", user.id).maybeSingle();
        if (ord) orderId = (ord as { id: string }).id;
      }
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: id,
        order_id: orderId,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });
      if (error) throw error;
      toast.success("Review submitted");
      setReviewComment("");
      setReviewRating(5);
      await loadReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-5 w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">Product not found.</p>
        <Link href="/shop" className="text-primary-500 hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const variants = (product as Product & { variants?: { id: string; size: string | null; color: string | null; price_adjustment: number; stock: number }[] }).variants ?? [];
  const basePrice = selectedVariant
    ? product.price + (selectedVariant.price_adjustment ?? 0)
    : product.price;
  const displayPrice = getProductEffectivePrice(basePrice, product.discount_type ?? null, product.discount_value ?? null);
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;
  const images = product.images?.length ? product.images : [null];
  const currentImage = images[imageIndex];
  const category = product.category as { name?: string; slug?: string } | undefined;
  const maxQty = Math.max(1, displayStock);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-primary-600 transition">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-neutral-400" />
        <Link href="/shop" className="hover:text-primary-600 transition">
          Shop
        </Link>
        {category?.slug && (
          <>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
            <Link
              href={`/shop?category=${category.slug}`}
              className="hover:text-primary-600 transition"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-400" />
        <span className="text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">{product.name}</span>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-8 lg:gap-12"
      >
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden ring-1 ring-neutral-100 dark:ring-neutral-700">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={currentImage.startsWith("http")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <span className="text-6xl font-display">233</span>
              </div>
            )}
            {displayStock > 0 && displayStock < 5 && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                Only {displayStock} left
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 ring-2 transition ${
                    i === imageIndex
                      ? "ring-primary-500"
                      : "ring-transparent hover:ring-gray-300"
                  }`}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={img.startsWith("http")}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="flex items-start justify-between gap-4 mb-2">
            {category && (
              <Link
                href={`/shop?category=${category.slug}`}
                className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full hover:bg-primary-100 transition"
              >
                {category.name}
              </Link>
            )}
            <div className="flex gap-2">
            <button
              onClick={toggleWishlist}
              className={`p-2 rounded-lg transition ${inWishlist ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {product.name}
          </h1>

          <p className="text-2xl text-primary-600 font-semibold mb-4">
            {hasDiscount && (
              <span className="line-through text-neutral-500 dark:text-neutral-400 font-normal text-lg mr-2">
                {productOriginalPriceDisplay}
              </span>
            )}
            {productPriceDisplay}
          </p>

          {variants.length > 0 && (
            <div className="space-y-3 mb-6">
              {variants.some((v) => v.size) && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(variants.map((v) => v.size).filter(Boolean))).map((s) => {
                      const v = variants.find((x) => x.size === s);
                      const isSelected = selectedVariant?.size === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedVariant(v ?? null)}
                          disabled={v && v.stock === 0}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                            isSelected ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 hover:border-gray-300"
                          } ${v && v.stock === 0 ? "opacity-50 cursor-not-allowed line-through" : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {variants.some((v) => v.color) && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(variants.map((v) => v.color).filter(Boolean))).map((c) => {
                      const v = variants.find((x) => x.color === c);
                      const isSelected = selectedVariant?.color === c;
                      return (
                        <button
                          key={c}
                          onClick={() => setSelectedVariant(v ?? null)}
                          disabled={v && v.stock === 0}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                            isSelected ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 hover:border-gray-300"
                          } ${v && v.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {product.description && (
            <p className="text-neutral-600 dark:text-neutral-300 mb-6 line-clamp-3 md:line-clamp-none">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                displayStock > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  displayStock > 0 ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {displayStock > 0 ? `${displayStock} in stock` : "Out of stock"}
            </div>
            {product.sku && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">SKU: {product.sku}</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {displayStock > 0 && (
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition"
                  aria-label="Decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="p-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition"
                  aria-label="Increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex gap-3 flex-1 sm:flex-initial">
              <motion.button
                onClick={handleAddToCart}
                disabled={displayStock === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to cart
              </motion.button>
              {displayStock === 0 && (
                <Link href="/request" className="flex-1 sm:flex-initial">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center w-full py-4 px-6 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-50 transition"
                  >
                    Request Quote
                  </motion.span>
                </Link>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Truck className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Free Shipping</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">On orders over GHS 500</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Secure Payment</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Paystack & Stripe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Sourced Fresh</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Quality assured</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs: Description & Shipping */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-16"
      >
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 font-medium text-sm border-b-2 transition ${
              activeTab === "description"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-3 font-medium text-sm border-b-2 transition ${
              activeTab === "shipping"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            Shipping & Returns
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 font-medium text-sm border-b-2 transition ${
              activeTab === "reviews"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === "description" && (
          <div className="prose prose-gray max-w-none text-neutral-700 dark:text-neutral-300">
            {product.description ? (
              <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-line">{product.description}</p>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400">
                No detailed description available. Contact us if you have questions about this product.
              </p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Write review: only for logged-in users */}
            {!user ? (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">Sign in to write a review.</p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/shop/${id}`)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
                >
                  Sign in
                </Link>
              </div>
            ) : myReview ? (
              <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50/50 dark:bg-primary-900/20">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Your review</p>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= myReview.rating ? "text-amber-500 fill-amber-500" : "text-neutral-300 dark:text-neutral-600"}`} />
                  ))}
                </div>
                {myReview.comment && <p className="text-neutral-700 dark:text-neutral-300 text-sm">{myReview.comment}</p>}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{formatDate(myReview.created_at)}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">Write a review</p>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i)}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition"
                        aria-label={`${i} star${i > 1 ? "s" : ""}`}
                      >
                        <Star className={`w-8 h-8 ${i <= reviewRating ? "text-amber-500 fill-amber-500" : "text-neutral-300 dark:text-neutral-600"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="review-comment" className="text-sm text-neutral-600 dark:text-neutral-400 block mb-2">Comment (optional)</label>
                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit review"}
                </button>
              </form>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-neutral-600 dark:text-neutral-400">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewSort("newest")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${reviewSort === "newest" ? "bg-primary-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setReviewSort("highest")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${reviewSort === "highest" ? "bg-primary-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"}`}
                >
                  Highest
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {[...reviews]
                .sort((a, b) => (reviewSort === "newest" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : b.rating - a.rating))
                .map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-4 h-4 ${i <= r.rating ? "text-amber-500 fill-amber-500" : "text-neutral-300 dark:text-neutral-600"}`} />
                        ))}
                      </div>
                      {r.order_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <BadgeCheck className="w-3 h-3" /> Verified purchase
                        </span>
                      )}
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-auto">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="text-neutral-700 dark:text-neutral-300 text-sm mt-2">{r.comment}</p>}
                  </div>
                ))}
              {reviews.length === 0 && <p className="text-neutral-500 dark:text-neutral-400 py-8 text-center">No reviews yet.</p>}
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-6 text-neutral-600 dark:text-neutral-400">
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Shipping</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Free shipping on orders over GHS 500</li>
                <li>Delivery within 5–10 business days in Ghana</li>
                <li>International shipping available on request</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Returns</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>14-day return policy for unused items</li>
                <li>Contact support to initiate a return</li>
              </ul>
            </div>
          </div>
        )}
      </motion.div>

      {/* Related products */}
      {related.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-20"
        >
          <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            You may also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {category && (
            <div className="mt-6 text-center">
              <Link
                href={`/shop?category=${category.slug}`}
                className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline"
              >
                View all {category.name}
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          )}
        </motion.section>
      )}

      <div className="mt-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to shop
        </Link>
      </div>
    </div>
  );
}
