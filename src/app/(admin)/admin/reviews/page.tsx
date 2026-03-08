"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { Star, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ReviewRow = {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  products: { name: string }[] | { name: string } | null;
  profiles: { name: string | null; email: string }[] | { name: string | null; email: string } | null;
};

function getProductName(p: ReviewRow["products"]): string {
  if (!p) return "Unknown product";
  return Array.isArray(p) ? p[0]?.name ?? "Unknown product" : p.name;
}
function getProfileDisplay(pr: ReviewRow["profiles"]): { name: string | null; email: string } | null {
  if (!pr) return null;
  return Array.isArray(pr) ? pr[0] ?? null : pr;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, user_id, product_id, order_id, rating, comment, created_at, products(name), profiles(name, email)")
      .order("created_at", { ascending: false });
    setReviews(((data as unknown) as ReviewRow[]) ?? []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete review");
      return;
    }
    toast.success("Review deleted");
    setReviews((prev) => prev.filter((r) => r.id !== id));
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
      <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
        Reviews
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Manage product reviews. Only logged-in users can write reviews.
      </p>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-neutral-800">
          <p>No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const profile = getProfileDisplay(r.profiles);
            return (
            <div
              key={r.id}
              className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-soft flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Link
                    href={`/shop/${r.product_id}`}
                    target="_blank"
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1"
                  >
                    {getProductName(r.products)}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {profile?.name ?? profile?.email ?? "Unknown user"}
                  {profile?.email && profile?.name ? (
                    <span className="text-gray-400"> ({profile.email})</span>
                  ) : null}
                </p>
                <div className="flex gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= r.rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-200 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
