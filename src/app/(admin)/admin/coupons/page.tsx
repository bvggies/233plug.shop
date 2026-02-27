"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { Plus, Tag, X, Edit2 } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  expiry: string | null;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const load = () => {
    supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCoupons((data as Coupon[]) || []));
    setLoading(false);
  };

  useEffect(() => { load(); }, [supabase]);

  const openCreate = () => {
    setModal("create");
    setEditing(null);
    setCode("");
    setDiscountType("percent");
    setValue("");
    setMinOrder("0");
    setExpiry("");
    setUsageLimit("");
  };

  const openEdit = (c: Coupon) => {
    setModal("edit");
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discount_type as "percent" | "fixed");
    setValue(String(c.value));
    setMinOrder(String(c.min_order ?? 0));
    setExpiry(c.expiry ? c.expiry.slice(0, 16) : "");
    setUsageLimit(c.usage_limit != null ? String(c.usage_limit) : "");
  };

  const save = async () => {
    const val = parseFloat(value);
    if (!code.trim() || isNaN(val) || val <= 0) {
      toast.error("Valid code and value required");
      return;
    }
    if (discountType === "percent" && val > 100) {
      toast.error("Percent discount cannot exceed 100");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        value: val,
        min_order: parseFloat(minOrder) || 0,
        expiry: expiry ? new Date(expiry).toISOString() : null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
      };
      if (editing) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Coupon updated");
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
        toast.success("Coupon created");
      }
      setModal(null);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const isExpired = (c: Coupon) => c.expiry && new Date(c.expiry) < new Date();
  const isExhausted = (c: Coupon) => c.usage_limit != null && c.used_count >= c.usage_limit;

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">Manage discount codes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" /> Create coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          No coupons yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Code</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Discount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Min order</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Usage</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Expiry</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <code className="font-mono font-semibold text-primary-600">{c.code}</code>
                    {(isExpired(c) || isExhausted(c)) && (
                      <span className="ml-2 text-xs text-amber-600">(inactive)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {c.discount_type === "percent" ? `${c.value}%` : `GHS ${c.value}`}
                  </td>
                  <td className="px-6 py-4 text-sm">GHS {c.min_order}</td>
                  <td className="px-6 py-4 text-sm">
                    {c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.expiry ? formatDate(c.expiry) : "—"}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-primary-500 text-sm font-medium hover:underline">Edit</button>
                    <button onClick={() => deleteCoupon(c.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold mb-4">{editing ? "Edit coupon" : "Create coupon"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 font-mono"
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed amount (GHS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={discountType === "percent" ? "20" : "50"}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum order (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage limit (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (optional)</label>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 rounded-xl">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-xl disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
