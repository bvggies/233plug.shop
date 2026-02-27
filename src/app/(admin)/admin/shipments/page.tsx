"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { Plus, Truck, X, Edit2, Printer } from "lucide-react";
import { ShippingLabelPrintView } from "@/components/admin/ShippingLabelPrintView";
import type { LabelItem } from "@/components/admin/ShippingLabel";

type Batch = {
  id: string;
  batch_name: string;
  shipment_date: string;
  status: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
};

type Order = { id: string; user_id: string; total_price: number; status: string; shipment_batch_id: string | null };
type Request = { id: string; user_id: string; product_name: string; status: string; shipment_batch_id: string | null };

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
};

export default function AdminShipmentsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "assign" | null>(null);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [batchName, setBatchName] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [tracking, setTracking] = useState("");
  const [estDelivery, setEstDelivery] = useState("");
  const [status, setStatus] = useState("pending");
  const [assignOrderIds, setAssignOrderIds] = useState<string[]>([]);
  const [assignRequestIds, setAssignRequestIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [labelModal, setLabelModal] = useState<Batch | null>(null);
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [labelLoading, setLabelLoading] = useState(false);
  const supabase = createClient();

  const load = () => {
    Promise.all([
      supabase.from("shipment_batches").select("*").order("shipment_date", { ascending: false }),
      supabase.from("orders").select("id, user_id, total_price, status, shipment_batch_id").in("status", ["paid", "shipped", "delivered"]),
      supabase.from("requests").select("id, user_id, product_name, status, shipment_batch_id").in("status", ["paid", "ordered", "in_warehouse", "shipped", "delivered"]),
    ]).then(([b, o, r]) => {
      setBatches((b.data as Batch[]) || []);
      setOrders((o.data as Order[]) || []);
      setRequests((r.data as Request[]) || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [supabase]);

  const openCreate = () => {
    setModal("create");
    setBatchName("");
    setShipmentDate(new Date().toISOString().slice(0, 10));
    setTracking("");
    setEstDelivery("");
    setStatus("pending");
  };

  const openEdit = (b: Batch) => {
    setModal("edit");
    setSelected(b);
    setBatchName(b.batch_name);
    setShipmentDate(b.shipment_date);
    setTracking(b.tracking_number ?? "");
    setEstDelivery(b.estimated_delivery ?? "");
    setStatus(b.status);
  };

  const openAssign = (b: Batch) => {
    setModal("assign");
    setSelected(b);
    setAssignOrderIds(orders.filter((o) => o.shipment_batch_id === b.id).map((o) => o.id));
    setAssignRequestIds(requests.filter((r) => r.shipment_batch_id === b.id).map((r) => r.id));
  };

  const openPrintLabels = async (b: Batch) => {
    setLabelLoading(true);
    setLabelModal(b);
    try {
      const batchOrders = orders.filter((o) => o.shipment_batch_id === b.id);
      const batchRequests = requests.filter((r) => r.shipment_batch_id === b.id);
      const userIds = Array.from(new Set([...batchOrders.map((o) => o.user_id), ...batchRequests.map((r) => r.user_id)]));
      if (userIds.length === 0) {
        setLabelItems([]);
        setLabelLoading(false);
        return;
      }
      const [profilesRes, addressesRes] = await Promise.all([
        supabase.from("profiles").select("id, name, email, phone, address").in("id", userIds),
        supabase.from("addresses").select("user_id, label, address, city, country, phone").eq("is_default", true).in("user_id", userIds),
      ]);
      const profiles = (profilesRes.data ?? []) as { id: string; name: string | null; email: string; phone: string | null; address: string | null }[];
      const addresses = (addressesRes.data ?? []) as { user_id: string; label: string; address: string; city: string | null; country: string; phone: string | null }[];
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const addressMap = new Map(addresses.map((a) => [a.user_id, a]));

      const buildRecipient = (userId: string) => {
        const profile = profileMap.get(userId);
        const addr = addressMap.get(userId);
        const name = profile?.name || profile?.email || "Customer";
        const address = addr?.address || profile?.address || "Address not provided";
        const city = addr?.city ?? undefined;
        const country = addr?.country || "Ghana";
        const phone = addr?.phone || profile?.phone || undefined;
        return { name, address, city, country, phone };
      };

      const items: LabelItem[] = [];
      batchOrders.forEach((o) => {
        items.push({
          type: "order",
          ref: o.id.slice(0, 8).toUpperCase(),
          description: `Order · ${o.status}`,
          recipient: buildRecipient(o.user_id),
        });
      });
      batchRequests.forEach((r) => {
        items.push({
          type: "request",
          ref: r.id.slice(0, 8).toUpperCase(),
          description: r.product_name,
          recipient: buildRecipient(r.user_id),
        });
      });
      setLabelItems(items);
    } catch {
      toast.error("Failed to load labels");
      setLabelModal(null);
    } finally {
      setLabelLoading(false);
    }
  };

  const createBatch = async () => {
    if (!batchName.trim() || !shipmentDate) {
      toast.error("Batch name and date required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("shipment_batches").insert({
        batch_name: batchName.trim(),
        shipment_date: shipmentDate,
        status,
        tracking_number: tracking.trim() || null,
        estimated_delivery: estDelivery || null,
      });
      if (error) throw error;
      toast.success("Batch created");
      setModal(null);
      load();
    } catch { toast.error("Failed to create"); }
    finally { setSaving(false); }
  };

  const updateBatch = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shipment_batches")
        .update({
          batch_name: batchName.trim(),
          shipment_date: shipmentDate,
          status,
          tracking_number: tracking.trim() || null,
          estimated_delivery: estDelivery || null,
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Batch updated");
      setModal(null);
      setSelected(null);
      load();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveAssignments = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from("orders").update({ shipment_batch_id: null }).eq("shipment_batch_id", selected.id);
      await supabase.from("requests").update({ shipment_batch_id: null }).eq("shipment_batch_id", selected.id);
      if (assignOrderIds.length) {
        await supabase.from("orders").update({ shipment_batch_id: selected.id }).in("id", assignOrderIds);
      }
      if (assignRequestIds.length) {
        await supabase.from("requests").update({ shipment_batch_id: selected.id }).in("id", assignRequestIds);
      }
      toast.success("Assignments saved");
      setModal(null);
      setSelected(null);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Shipment Batches</h1>
          <p className="text-gray-500 text-sm mt-1">Manage bi-weekly shipment batches</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" /> Create batch
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          No shipment batches. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{b.batch_name}</p>
                  <p className="text-sm text-gray-500">Ship date: {formatDate(b.shipment_date)}</p>
                  <p className="text-sm text-gray-500">
                    {b.tracking_number ? `Tracking: ${b.tracking_number}` : "No tracking"}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-gray-100"}`}>
                  {b.status}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openPrintLabels(b)}
                  disabled={labelLoading}
                  className="px-4 py-2 border border-primary-500 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-50 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Labels
                </button>
                <button
                  onClick={() => openAssign(b)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Assign orders
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold mb-4">{modal === "create" ? "Create batch" : "Edit batch"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch name</label>
                <input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Feb 2025 Batch 1"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipment date</label>
                <input
                  type="date"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking number</label>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated delivery</label>
                <input
                  type="date"
                  value={estDelivery}
                  onChange={(e) => setEstDelivery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 rounded-xl">Cancel</button>
              <button
                onClick={modal === "create" ? createBatch : updateBatch}
                disabled={saving}
                className="flex-1 py-2 bg-primary-500 text-white rounded-xl disabled:opacity-50"
              >
                {saving ? "Saving…" : modal === "create" ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {modal === "assign" && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold mb-4">Assign to {selected.batch_name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orders (paid/shipped/delivered)</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {orders.filter((o) => ["paid", "shipped", "delivered"].includes(o.status)).map((o) => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignOrderIds.includes(o.id)}
                        onChange={(e) =>
                          setAssignOrderIds((prev) =>
                            e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id)
                          )
                        }
                      />
                      <span className="text-sm">Order #{o.id.slice(0, 8)} - {o.status}</span>
                    </label>
                  ))}
                  {orders.filter((o) => ["paid", "shipped", "delivered"].includes(o.status)).length === 0 && (
                    <p className="text-sm text-gray-500">No eligible orders</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requests (ordered / in warehouse / shipped / delivered)</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {requests.filter((r) => ["ordered", "in_warehouse", "shipped", "delivered"].includes(r.status)).map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignRequestIds.includes(r.id)}
                        onChange={(e) =>
                          setAssignRequestIds((prev) =>
                            e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)
                          )
                        }
                      />
                      <span className="text-sm truncate">{r.product_name} - {r.status}</span>
                    </label>
                  ))}
                  {requests.filter((r) => ["ordered", "in_warehouse", "shipped", "delivered"].includes(r.status)).length === 0 && (
                    <p className="text-sm text-gray-500">No eligible requests</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 rounded-xl">Cancel</button>
              <button onClick={saveAssignments} disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-xl disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Labels print modal */}
      {labelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto" onClick={() => !labelLoading && setLabelModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="labels-title">
            {labelLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading labels…</p>
              </div>
            ) : (
              <ShippingLabelPrintView
                batch={{ batch_name: labelModal.batch_name, tracking_number: labelModal.tracking_number }}
                items={labelItems}
                onClose={() => setLabelModal(null)}
                autoPrint={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
