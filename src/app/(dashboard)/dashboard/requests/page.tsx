"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, MessageSquare, Check, X, Tag } from "lucide-react";

type RequestRow = {
  id: string;
  product_name: string;
  status: string;
  budget: number | null;
  quote_price: number | null;
  quote_response: string | null;
  quote_response_message: string | null;
  counter_price: number | null;
  created_at: string;
};

type RequestUpdate = { id: string; message: string; status_snapshot: string | null; created_at: string };

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [updatesByRequest, setUpdatesByRequest] = useState<Record<string, RequestUpdate[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reductionRequestId, setReductionRequestId] = useState<string | null>(null);
  const [reductionMessage, setReductionMessage] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data } = await supabase
          .from("requests")
          .select("id, product_name, status, budget, quote_price, quote_response, quote_response_message, counter_price, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setRequests(data || []);
        const ids = (data || []).map((r) => r.id);
        if (ids.length > 0) {
          const { data: updates } = await supabase
            .from("request_updates")
            .select("id, request_id, message, status_snapshot, created_at")
            .in("request_id", ids)
            .order("created_at", { ascending: true });
          const byRequest: Record<string, RequestUpdate[]> = {};
          for (const u of updates || []) {
            const rid = (u as { request_id: string }).request_id;
            if (!byRequest[rid]) byRequest[rid] = [];
            byRequest[rid].push({
              id: u.id,
              message: u.message,
              status_snapshot: u.status_snapshot ?? null,
              created_at: u.created_at,
            });
          }
          setUpdatesByRequest(byRequest);
        } else {
          setUpdatesByRequest({});
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const acceptQuote = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "accepted", quote_response: "accepted", quote_response_message: null, counter_price: null })
        .eq("id", requestId);
      if (error) throw error;
      toast.success("Quote accepted. You can proceed to pay when ready.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "accepted", quote_response: "accepted", quote_response_message: null, counter_price: null }
            : r
        )
      );
    } catch {
      toast.error("Failed to accept quote");
    } finally {
      setActionLoading(null);
    }
  };

  const declineQuote = async (requestId: string, message?: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          quote_response: "declined",
          quote_response_message: message?.trim() || null,
          counter_price: null,
        })
        .eq("id", requestId);
      if (error) throw error;
      toast.success("Quote declined. We may send a new quote.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, quote_response: "declined", quote_response_message: message?.trim() || null, counter_price: null }
            : r
        )
      );
    } catch {
      toast.error("Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  const submitReductionRequest = async () => {
    if (!reductionRequestId) return;
    const price = counterPrice.trim() ? parseFloat(counterPrice) : null;
    if (counterPrice.trim() && (isNaN(price!) || price! < 0)) {
      toast.error("Enter a valid counter price");
      return;
    }
    setActionLoading(reductionRequestId);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          quote_response: "reduction_requested",
          quote_response_message: reductionMessage.trim() || null,
          counter_price: price,
        })
        .eq("id", reductionRequestId);
      if (error) throw error;
      toast.success("Reduction request sent. We'll get back to you.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reductionRequestId
            ? {
                ...r,
                quote_response: "reduction_requested",
                quote_response_message: reductionMessage.trim() || null,
                counter_price: price,
              }
            : r
        )
      );
      setReductionRequestId(null);
      setReductionMessage("");
      setCounterPrice("");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    quoted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    accepted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ordered: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    in_warehouse: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
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
      <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6">My Requests</h1>
      {requests.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">No requests yet.</p>
          <a href="/request" className="mt-4 inline-block text-primary-500 dark:text-primary-400 hover:underline">Submit a request</a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const updates = updatesByRequest[r.id] || [];
            const isExpanded = expandedId === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-card p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{r.product_name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatDate(r.created_at)}</p>
                    {r.budget != null && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">Budget: {formatPrice(r.budget, "GHS")}</p>
                    )}
                    {r.quote_price != null && (
                      <p className="text-primary-600 dark:text-primary-400 font-semibold">Quote: {formatPrice(r.quote_price, "GHS")}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize shrink-0 ${statusColors[r.status] || "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>

                {/* User response to quote */}
                {r.status === "quoted" && r.quote_response && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {r.quote_response === "accepted" && <Check className="w-4 h-4 text-green-600" />}
                    {r.quote_response === "declined" && <X className="w-4 h-4 text-amber-600" />}
                    {r.quote_response === "reduction_requested" && <Tag className="w-4 h-4 text-primary-600" />}
                    <span>
                      Your response: {r.quote_response.replace("_", " ")}
                      {r.quote_response_message && ` — ${r.quote_response_message}`}
                      {r.counter_price != null && ` (counter: ${formatPrice(r.counter_price, "GHS")})`}
                    </span>
                  </div>
                )}

                {/* Accept / Decline / Request reduction — only when quoted and no response yet */}
                {r.status === "quoted" && !r.quote_response && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Respond to quote</p>
                    {reductionRequestId === r.id ? (
                      <div className="flex flex-col gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Counter price (GHS, optional)"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          className="input w-full"
                        />
                        <textarea
                          placeholder="Message (optional)"
                          value={reductionMessage}
                          onChange={(e) => setReductionMessage(e.target.value)}
                          rows={2}
                          className="input w-full resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={submitReductionRequest}
                            disabled={actionLoading === r.id}
                            className="btn-primary"
                          >
                            {actionLoading === r.id ? "Sending…" : "Send reduction request"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReductionRequestId(null); setReductionMessage(""); setCounterPrice(""); }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => acceptQuote(r.id)}
                          disabled={actionLoading === r.id}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {actionLoading === r.id ? "…" : "Accept quote"}
                        </button>
                        <button
                          type="button"
                          onClick={() => declineQuote(r.id)}
                          disabled={actionLoading === r.id}
                          className="btn-secondary inline-flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          {actionLoading === r.id ? "…" : "Decline quote"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReductionRequestId(r.id)}
                          disabled={actionLoading === r.id}
                          className="btn-secondary inline-flex items-center gap-2"
                        >
                          <Tag className="w-4 h-4" />
                          Request reduction
                        </button>
                      </div>
                    )}
                  </div>
                )}
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Updates ({updates.length})
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-3 mt-3"
                        >
                          {updates.map((u) => (
                            <li
                              key={u.id}
                              className="pl-4 border-l-2 border-primary-200 dark:border-primary-800 py-1"
                            >
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">{u.message}</p>
                              {u.status_snapshot && (
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Status: {u.status_snapshot.replace("_", " ")}
                                </span>
                              )}
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {formatDate(u.created_at)}
                              </p>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
