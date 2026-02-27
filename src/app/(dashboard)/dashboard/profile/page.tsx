"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ChevronRight,
  User,
  Lock,
  Wallet,
  Gift,
  MapPin,
  Bell,
  LogOut,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProfileData {
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  referral_code: string | null;
  wallet_balance: number;
  avatar_url: string | null;
}

interface FormData {
  name: string;
  phone: string;
  address: string;
}

export default function DashboardProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { register, handleSubmit, setValue } = useForm<FormData>();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const [
          { data: p },
          { count: orders },
          { count: requests },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("name, email, phone, address, referral_code, wallet_balance, avatar_url")
            .eq("id", user.id)
            .single(),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("requests").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);
        if (p) setProfile(p as ProfileData);
        setOrdersCount(orders ?? 0);
        setRequestsCount(requests ?? 0);
        if (p) {
          setValue("name", p.name || "");
          setValue("phone", p.phone || "");
          setValue("address", p.address || "");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, setValue]);

  const onEditSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((prev) =>
        prev ? { ...prev, name: data.name, phone: data.phone || null, address: data.address || null } : prev
      );
      toast.success("Profile updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 rounded-b-[2rem]" />
        <div className="h-24 bg-gray-200 rounded-2xl -mt-20 mx-4" />
        <div className="space-y-2 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const menuItem = (
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
    subtitle?: string,
    onClick?: () => void,
    href?: string
  ) => {
    const content = (
      <>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{label}</p>
            {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
      </>
    );
    const cls =
      "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left";
    if (href) {
      return (
        <Link key={label} href={href} className={cls}>
          {content}
        </Link>
      );
    }
    return (
      <button key={label} type="button" onClick={onClick} className={cls}>
        {content}
      </button>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-md mx-auto pb-24">
      {/* Gradient header */}
      <div className="h-44 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-b-[2rem] relative" />

      {/* Profile card overlapping header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative -mt-24 mx-4"
      >
        <div className="bg-white rounded-[1.75rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="pt-6 pb-4 px-6 flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-display font-bold text-primary-600">
                    {(profile.name || profile.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-display font-bold text-gray-900 truncate">
                {profile.name || "User"}
              </h1>
              <p className="text-sm text-gray-500 truncate">{profile.email}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100">
            <Link
              href="/dashboard"
              className="py-4 px-4 text-center hover:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-display font-bold text-gray-900">{ordersCount}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </Link>
            <Link
              href="/dashboard/requests"
              className="py-4 px-4 text-center hover:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-display font-bold text-gray-900">{requestsCount}</p>
              <p className="text-xs text-gray-500">Requests</p>
            </Link>
            <Link
              href="/dashboard/wallet"
              className="py-4 px-4 text-center hover:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-display font-bold text-primary-600">
                {formatPrice(profile.wallet_balance, "GHS")}
              </p>
              <p className="text-xs text-gray-500">Wallet</p>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Menu list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 px-4 space-y-2"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden divide-y divide-gray-100">
          {menuItem(User, "Edit profile", profile.phone || profile.address || undefined, () => setEditOpen(true))}
          {menuItem(Lock, "Change password", undefined, () => setPasswordOpen(true))}
          {menuItem(Wallet, "Wallet", formatPrice(profile.wallet_balance, "GHS"), undefined, "/dashboard/wallet")}
          {menuItem(Gift, "Referral code", profile.referral_code || undefined, undefined, "/dashboard/referrals")}
          {menuItem(MapPin, "Addresses", undefined, undefined, "/dashboard/addresses")}
          {menuItem(Bell, "Notifications", undefined, undefined, "/dashboard/notifications")}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 text-red-600 font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </motion.div>

      {/* Edit profile sheet */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2rem] shadow-2xl max-h-[90vh] overflow-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-gray-900">Edit profile</h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onEditSubmit)} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <input
                    {...register("name")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <textarea
                    {...register("address")}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change password sheet */}
      <ChangePasswordSheet
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        supabase={supabase}
      />
    </div>
  );
}

function ChangePasswordSheet({
  open,
  onClose,
  supabase,
}: {
  open: boolean;
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2rem] shadow-2xl"
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-lg font-display font-bold text-gray-900">Change password</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
