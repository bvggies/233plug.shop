"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const supabase = createClient();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id, supabase]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock === 0) {
      toast.error("Out of stock");
      return;
    }
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      product,
    });
    toast.success("Added to cart");
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse h-96 bg-gray-200 rounded-2xl" />
        <div className="mt-8 h-8 bg-gray-200 rounded w-1/3" />
        <div className="mt-4 h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link href="/shop" className="text-primary-500 hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [null];
  const currentImage = images[imageIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to shop
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-12"
      >
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                unoptimized={currentImage.startsWith("http")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl font-display">233</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 ${
                    i === imageIndex ? "border-primary-500" : "border-transparent"
                  }`}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
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

        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <p className="text-2xl text-primary-600 font-semibold mb-6">
            {formatPrice(product.price, product.currency)}
          </p>

          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          <div className="flex items-center gap-4 mb-8">
            <span
              className={`text-sm font-medium ${
                product.stock > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="flex gap-4">
            <motion.button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to cart
            </motion.button>
            {product.stock === 0 && (
              <Link href="/request">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center py-4 px-6 border-2 border-primary-500 text-primary-500 rounded-xl font-medium hover:bg-primary-50"
                >
                  Request Quote
                </motion.span>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
