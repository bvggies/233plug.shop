"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import type { ShippingZone } from "@/types";

export default function AdminShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    country: "Ghana",
    estimated_days_min: "",
    estimated_days_max: "",
    is_active: true,
    sort_order: "0",
  });
  const supabase = createClient();

  const load = () => {
    supabase
      .from("shipping_zones")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          setZones([]);
        } else {
          setZones((data as ShippingZone[]) ?? []);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on mount only
  }, []);

  const openAdd = () => {
    setEditingZone(null);
    setForm({
      name: "",
      description: "",
      country: "Ghana",
      estimated_days_min: "",
      estimated_days_max: "",
      is_active: true,
      sort_order: String(zones.length),
    });
    setModal("add");
  };

  const openEdit = (z: ShippingZone) => {
    setEditingZone(z);
    setForm({
      name: z.name,
      description: z.description ?? "",
      country: z.country,
      estimated_days_min: z.estimated_days_min != null ? String(z.estimated_days_min) : "",
      estimated_days_max: z.estimated_days_max != null ? String(z.estimated_days_max) : "",
      is_active: z.is_active,
      sort_order: String(z.sort_order),
    });
    setModal("edit");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        country: form.country.trim() || "Ghana",
        estimated_days_min: form.estimated_days_min ? parseInt(form.estimated_days_min, 10) : null,
        estimated_days_max: form.estimated_days_max ? parseInt(form.estimated_days_max, 10) : null,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editingZone) {
        const { error } = await supabase.from("shipping_zones").update(payload).eq("id", editingZone.id);
        if (error) throw error;
        toast.success("Zone updated");
      } else {
        const { error } = await supabase.from("shipping_zones").insert(payload);
        if (error) throw error;
        toast.success("Zone added");
      }
      setModal(null);
      setEditingZone(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Delete this shipping zone? Orders and batches will keep their link until you change it.")) return;
    try {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
      toast.success("Zone deleted");
      load();
      if (editingZone?.id === id) {
        setModal(null);
        setEditingZone(null);
      }
    } catch {
      toast.error("Failed to delete");
    }
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/shipments" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Shipments
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Shipping zones</h1>
            <p className="text-gray-500 text-sm mt-1">Define delivery zones and link them to orders and shipment batches.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" /> Add zone
        </button>
      </div>

      {zones.length === 0 && !modal ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100 dark:border-gray-800">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p>No shipping zones yet.</p>
          <p className="text-sm mt-1">Add zones (e.g. Accra, Greater Accra, Other Ghana) and assign them to orders and batches.</p>
          <button onClick={openAdd} className="mt-4 btn-primary">
            Add zone
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Country</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Est. days</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{z.name}</p>
                    {z.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{z.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{z.country}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {z.estimated_days_min != null || z.estimated_days_max != null
                      ? [z.estimated_days_min, z.estimated_days_max].filter((d) => d != null).join("–")
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${z.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {z.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => openEdit(z)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/20 rounded-lg" aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteZone(z.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg ml-1" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingZone ? "Edit zone" : "Add shipping zone"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Accra, Greater Accra"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Ghana"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. days (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.estimated_days_min}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_days_min: e.target.value }))}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. days (max)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.estimated_days_max}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_days_max: e.target.value }))}
                    placeholder="e.g. 7"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-gray-300 text-primary-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50">
                  {saving ? "Saving…" : editingZone ? "Update" : "Add zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
