"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { X, Send, Edit2, ShoppingCart } from "lucide-react";

type RequestRow = {
  id: string;
  user_id: string;
  product_name: string;
  link_or_image: string;
  description: string | null;
  budget: number | null;
  status: string;
  quote_price: number | null;
  shipment_batch_id: string | null;
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
  accepted: "bg-indigo-100 text-indigo-800",
  paid: "bg-blue-100 text-blue-800",
  ordered: "bg-cyan-100 text-cyan-800",
  in_warehouse: "bg-teal-100 text-teal-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [editingQuote, setEditingQuote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const supabase = createClient();

  const load = () => {
    supabase
      .from("requests")
      .select("id, user_id, product_name, link_or_image, description, budget, status, quote_price, shipment_batch_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setRequests((data as RequestRow[]) || []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [supabase]);

  const sendQuote = async (isUpdate = false) => {
    if (!selected || !quotePrice || isNaN(parseFloat(quotePrice))) {
      toast.error("Enter a valid quote amount");
      return;
    }
    setSaving(true);
    try {
      const amount = parseFloat(quotePrice);
      const { error } = await supabase
        .from("requests")
        .update(isUpdate ? { quote_price: amount } : { status: "quoted", quote_price: amount })
        .eq("id", selected.id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: selected.user_id,
        type: "quote",
        message: isUpdate
          ? `Your quote for "${selected.product_name}" was updated to ${formatPrice(amount, "GHS")}.`
          : `We've sent you a quote of ${formatPrice(amount, "GHS")} for "${selected.product_name}". Check your requests.`,
      });
      toast.success(isUpdate ? "Quote updated" : "Quote sent");
      setSelected(null);
      setQuotePrice("");
      setEditingQuote(false);
      load();
    } catch { toast.error("Failed to save quote"); }
    finally { setSaving(false); }
  };

  const convertToOrder = async () => {
    if (!selected) return;
    setConverting(true);
    try {
      const price = selected.quote_price ?? 0;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: selected.user_id,
          status: "pending",
          total_price: price,
          currency: "GHS",
        })
        .select("id")
        .single();
      if (orderErr || !order) throw orderErr;
      await supabase.from("requests").update({
        status: "ordered",
        shipment_batch_id: null,
      }).eq("id", selected.id);
      await supabase.from("notifications").insert({
        user_id: selected.user_id,
        type: "order",
        message: `Your request "${selected.product_name}" has been converted to an order. Pay to proceed.`,
      });
      toast.success("Converted to order");
      setSelected(null);
      load();
    } catch { toast.error("Failed to convert"); }
    finally { setConverting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const r = requests.find((x) => x.id === id);
      if (!r) return;
      const { error } = await supabase.from("requests").update({ status }).eq("id", id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: r.user_id,
        type: "request_status",
        message: `Request "${r.product_name}" is now ${status.replace("_", " ")}.`,
      });
      toast.success("Status updated");
      load();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch { toast.error("Failed to update"); }
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
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Requests</h1>
        <p className="text-gray-500 text-sm mt-1">{requests.length} request(s)</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          No requests yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Budget</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelected(r); setQuotePrice(String(r.quote_price ?? "")); }}
                        className="text-left text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {r.product_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.budget != null ? formatPrice(r.budget, "GHS") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelected(r); setQuotePrice(String(r.quote_price ?? "")); }}
                        className="text-primary-500 text-sm font-medium hover:underline"
                      >
                        View / Quote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setEditingQuote(false); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <h2 className="text-lg font-display font-bold text-gray-900">{selected.product_name}</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600"><strong>Link/Image:</strong> <a href={selected.link_or_image} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline break-all">{selected.link_or_image}</a></p>
              {selected.description && <p className="text-sm text-gray-600"><strong>Description:</strong> {selected.description}</p>}
              <p className="text-sm"><strong>Budget:</strong> {selected.budget != null ? formatPrice(selected.budget, "GHS") : "—"}</p>
              <p className="text-sm"><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selected.status]}`}>{selected.status.replace("_", " ")}</span></p>
              {selected.quote_price != null && <p className="text-sm"><strong>Quote:</strong> {formatPrice(selected.quote_price, "GHS")}</p>}

              {(selected.status === "pending" || selected.status === "reviewing") && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => sendQuote()}
                      disabled={saving}
                      className="flex-1 py-2 px-4 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Send quote
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, "reviewing")}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
                    >
                      Mark Reviewing
                    </button>
                  </div>
                </div>
              )}

              {selected.status === "quoted" && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {editingQuote ? (
                    <>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        placeholder="Quote price (GHS)"
                      />
                      <div className="flex gap-3">
                        <button onClick={() => setEditingQuote(false)} className="flex-1 py-2 border border-gray-200 rounded-xl">Cancel</button>
                        <button onClick={() => sendQuote(true)} disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-xl disabled:opacity-50">Update quote</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => { setEditingQuote(true); setQuotePrice(String(selected.quote_price ?? "")); }} className="flex-1 py-2 px-4 border border-primary-500 text-primary-500 font-medium rounded-xl">Edit quote</button>
                      <button onClick={convertToOrder} disabled={converting} className="flex-1 py-2 px-4 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Convert to order
                      </button>
                    </div>
                  )}
                </div>
              )}

              {["paid", "ordered", "in_warehouse"].includes(selected.status) && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update status</label>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="ordered">Ordered</option>
                    <option value="in_warehouse">In Warehouse</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
