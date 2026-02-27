"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<
    { id: string; product_name: string; status: string; budget: number | null; quote_price: number | null; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data } = await supabase.from("requests").select("id, product_name, status, budget, quote_price, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
        setRequests(data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    reviewing: "bg-blue-100 text-blue-800",
    quoted: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">My Requests</h1>
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-gray-500">No requests yet.</p>
          <a href="/request" className="mt-4 inline-block text-primary-500 hover:underline">Submit a request</a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{r.product_name}</p>
                  <p className="text-sm text-gray-500">{formatDate(r.created_at)}</p>
                  {r.budget && <p className="text-sm text-gray-600">Budget: {formatPrice(r.budget, "GHS")}</p>}
                  {r.quote_price && <p className="text-primary-600 font-semibold">Quote: {formatPrice(r.quote_price, "GHS")}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status.replace("_", " ")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
