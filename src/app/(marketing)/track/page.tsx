"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Package, FileText, Clock, Truck } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { PageHero } from "@/components/ui/PageHero";
import type { ShipmentBatch, ShipmentTrackingEvent } from "@/types";

type TrackingResult = {
  type: "order" | "request";
  id: string;
  status: string;
  created_at: string;
  total_price?: number;
  currency?: string;
  product_name?: string;
  quote_price?: number | null;
  shipment_batch?: {
    id: string;
    batch_name: string;
    tracking_number: string | null;
    estimated_delivery: string | null;
    status: string;
  } | null;
  tracking_events: { id: string; event_type: string; message: string | null; created_at: string }[];
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400",
  cancelled: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
  reviewing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  quoted: "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  in_warehouse: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400",
};

function TrackContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter your tracking code");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error === "Not found" ? "No order or request found with this code." : data?.error ?? "Lookup failed");
        setResult(null);
        return;
      }
      setResult(data as TrackingResult);
    } catch {
      setError("Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHero
        title="Track your order or request"
        subtitle="Enter the tracking code from your confirmation email or receipt. No login required."
        imageUrl="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&q=80"
        icon={<Truck className="w-10 h-10 text-white" />}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-10 -mt-2">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSubmit}
          className="surface-card rounded-2xl p-6 lg:p-8 shadow-soft border border-neutral-100 dark:border-[var(--surface-border)] mb-8"
        >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. O1A2B3C4D5 or R9Z8Y7X6W5"
              className="input-base pl-12 pr-4 py-3 w-full"
              aria-label="Tracking code"
              autoFocus={!initialCode}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? "Searching…" : "Track"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </motion.form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="surface-card rounded-2xl p-6 lg:p-8 shadow-soft border border-neutral-100 dark:border-[var(--surface-border)]">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {result.type === "order" ? (
                <Package className="w-8 h-8 text-primary-500" />
              ) : (
                <FileText className="w-8 h-8 text-primary-500" />
              )}
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {result.type === "order" ? "Order" : "Request"}
                  {result.type === "request" && result.product_name && ` · ${result.product_name}`}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  Placed {formatDate(result.created_at)}
                </p>
              </div>
              <span
                className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                  statusColors[result.status] ?? "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                }`}
              >
                {result.status.replace(/_/g, " ")}
              </span>
            </div>
            {result.type === "order" && result.total_price != null && (
              <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {formatPrice(result.total_price, result.currency ?? "GHS")}
              </p>
            )}
            {result.type === "request" && result.quote_price != null && (
              <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                Quote: {formatPrice(result.quote_price, "GHS")}
              </p>
            )}
          </div>

          {result.shipment_batch && result.tracking_events && (
            <div className="surface-card rounded-2xl p-6 lg:p-8 shadow-soft border border-neutral-100 dark:border-[var(--surface-border)]">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-500" />
                Shipment updates
              </h2>
              <TrackingTimeline
                batch={result.shipment_batch as ShipmentBatch}
                events={result.tracking_events as ShipmentTrackingEvent[]}
                showBatchInfo={true}
              />
            </div>
          )}

          {result.type === "order" && !result.shipment_batch && (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Your order hasn’t been assigned to a shipment yet. We’ll add tracking here once it ships.
            </p>
          )}
          {result.type === "request" && !result.shipment_batch && result.status !== "pending" && result.status !== "reviewing" && result.status !== "quoted" && (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              This request hasn’t been assigned to a shipment yet. Tracking will appear here when it ships.
            </p>
          )}
        </motion.div>
      )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-6" />
        <div className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
