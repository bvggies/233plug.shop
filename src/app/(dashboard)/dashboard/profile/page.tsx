"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ShoppingBag,
  FileText,
  Receipt,
  Home,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

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
  const [recentReceipts, setRecentReceipts] = useState<{ id: string; total_price: number; currency: string; created_at: string }[]>([]);
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
          { data: paidOrders },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("name, email, phone, address, referral_code, wallet_balance, avatar_url")
            .eq("id", user.id)
            .single(),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("requests").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("orders")
            .select("id, total_price, currency, created_at")
            .eq("user_id", user.id)
            .in("status", ["paid", "shipped", "delivered"])
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
        if (p) setProfile(p as ProfileData);
        setOrdersCount(orders ?? 0);
        setRequestsCount(requests ?? 0);
        setRecentReceipts((paidOrders as { id: string; total_price: number; currency: string; created_at: string }[]) ?? []);
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
        <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-b-[2rem]" />
        <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-2xl -mt-20 mx-4" />
        <div className="space-y-2 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{label}</p>
            {subtitle && <p className="text-description truncate">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
      </>
    );
    const cls =
      "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-white/5 active:bg-neutral-100 dark:active:bg-white/10 transition-colors text-left";
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
      <div className="h-44 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-b-[2rem] md:rounded-b-3xl relative" />

      {/* Profile card overlapping header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative -mt-24 mx-4"
      >
        <div className="surface-card rounded-2xl md:rounded-3xl shadow-float overflow-hidden">
          <div className="pt-6 pb-4 px-6 flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-800 dark:to-primary-700 flex items-center justify-center overflow-hidden relative">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Profile avatar"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    sizes="80px"
                    unoptimized={profile.avatar_url.startsWith("http")}
                  />
                ) : (
                  <span className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                    {(profile.name || profile.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {profile.name || "User"}
              </h1>
              <p className="text-description truncate">{profile.email}</p>
            </div>
          </div>

          {/* Stat cards grid – dashboard style */}
          <div className="grid grid-cols-2 gap-3 p-4 border-t border-neutral-100 dark:border-[var(--surface-border)]">
            <Link
              href="/dashboard"
              className="surface-card-hover rounded-2xl p-4 flex flex-col items-center gap-1 text-center transition-transform hover:-translate-y-1"
            >
              <ShoppingBag className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              <p className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">{ordersCount}</p>
              <p className="text-description text-xs">Orders</p>
            </Link>
            <Link
              href="/dashboard/requests"
              className="surface-card-hover rounded-2xl p-4 flex flex-col items-center gap-1 text-center transition-transform hover:-translate-y-1"
            >
              <FileText className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              <p className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">{requestsCount}</p>
              <p className="text-description text-xs">Requests</p>
            </Link>
            <Link
              href="/dashboard/wallet"
              className="surface-card-hover rounded-2xl p-4 flex flex-col items-center gap-1 text-center transition-transform hover:-translate-y-1"
            >
              <Wallet className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              <p className="text-xl font-display font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(profile.wallet_balance, "GHS")}
              </p>
              <p className="text-description text-xs">Wallet</p>
            </Link>
            <Link
              href="/dashboard/referrals"
              className="surface-card-hover rounded-2xl p-4 flex flex-col items-center gap-1 text-center transition-transform hover:-translate-y-1"
            >
              <Gift className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              <p className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">—</p>
              <p className="text-description text-xs">Referrals</p>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Recent receipts */}
      {recentReceipts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 px-4"
        >
          <div className="surface-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-[var(--surface-border)] flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                Recent receipts
              </h2>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                All orders
              </Link>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-[var(--surface-border)]">
              {recentReceipts.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}/receipt`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatPrice(order.total_price, order.currency)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Menu list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 px-4 space-y-2"
      >
        <div className="surface-card rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-[var(--surface-border)]">
          {menuItem(Home, "Home", "Back to main page", undefined, "/")}
          {menuItem(User, "Edit profile", profile.phone || profile.address || undefined, () => setEditOpen(true))}
          {menuItem(Lock, "Change password", undefined, () => setPasswordOpen(true))}
          {menuItem(Wallet, "Wallet", formatPrice(profile.wallet_balance, "GHS"), undefined, "/dashboard/wallet")}
          {menuItem(Receipt, "Order history & receipts", undefined, undefined, "/dashboard")}
          {menuItem(Gift, "Referral code", profile.referral_code || undefined, undefined, "/dashboard/referrals")}
          {menuItem(MapPin, "Addresses", undefined, undefined, "/dashboard/addresses")}
          {menuItem(Bell, "Notifications", undefined, undefined, "/dashboard/notifications")}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
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
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[var(--surface-bg)] rounded-t-[2rem] shadow-2xl max-h-[90vh] overflow-auto border-t border-neutral-200 dark:border-[var(--surface-border)]"
            >
              <div className="sticky top-0 bg-white dark:bg-[var(--surface-bg)] border-b border-neutral-100 dark:border-[var(--surface-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100">Edit profile</h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onEditSubmit)} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full name</label>
                  <input
                    {...register("name")}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone</label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Address</label>
                  <textarea
                    {...register("address")}
                    rows={3}
                    className="input-base resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full py-3.5 rounded-xl"
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
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[var(--surface-bg)] rounded-t-[2rem] shadow-2xl border-t border-neutral-200 dark:border-[var(--surface-border)]"
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-[var(--surface-border)]">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100">Change password</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10">
            <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl"
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
