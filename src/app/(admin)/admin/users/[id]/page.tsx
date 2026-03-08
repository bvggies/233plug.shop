"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Shield } from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["user", "staff", "admin", "super_admin"];

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  wallet_balance: number;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    role: "user" as UserRole,
    wallet_balance: "",
  });
  const supabase = createClient();

  const isSuperAdmin = currentUserRole === "super_admin";

  useEffect(() => {
    if (!id) {
      router.replace("/admin/users");
      return;
    }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentUserRole((myProfile?.role as UserRole) ?? null);
      }
      const { data: p, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, address, role, wallet_balance, referral_code, created_at, updated_at")
        .eq("id", id)
        .single();
      if (error || !p) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const prof = p as Profile;
      setProfile(prof);
      setForm({
        name: prof.name ?? "",
        phone: prof.phone ?? "",
        address: prof.address ?? "",
        role: prof.role,
        wallet_balance: String(prof.wallet_balance ?? 0),
      });
      setLoading(false);
    }
    load();
  }, [id, router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const payload: { name: string | null; phone: string | null; address: string | null; role?: UserRole; wallet_balance?: number } = {
        name: form.name.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      if (isSuperAdmin) {
        payload.role = form.role;
        const w = parseFloat(form.wallet_balance);
        if (!isNaN(w) && w >= 0) payload.wallet_balance = w;
      }
      const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
      if (error) throw error;
      toast.success("User updated");
      setProfile({ ...profile, ...payload, wallet_balance: payload.wallet_balance ?? profile.wallet_balance });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <p className="text-gray-500 mb-4">User not found.</p>
        <Link href="/admin/users" className="text-primary-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">{profile.name || "No name"}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Joined {formatDate(profile.created_at)}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100 break-all">{profile.email}</dd>
                </div>
              </div>
              {profile.referral_code && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Referral code:</span>
                  <span className="font-mono font-medium">{profile.referral_code}</span>
                </div>
              )}
            </dl>
          </div>

          {isSuperAdmin && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium mb-1">
                <Shield className="w-4 h-4" />
                Super admin only
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">You can change this user&apos;s role and wallet balance.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-6">Edit profile</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Delivery address"
                />
              </div>

              {isSuperAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wallet balance (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.wallet_balance}
                      onChange={(e) => setForm((f) => ({ ...f, wallet_balance: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust the user&apos;s wallet balance. Use with care.</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <Link
                href="/admin/users"
                className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
