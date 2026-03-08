"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { Wallet, CreditCard, ArrowRightLeft } from "lucide-react";

export type TransactionSource = "wallet" | "paystack" | "stripe";

export type UnifiedTransaction = {
  id: string;
  source: TransactionSource;
  amount: number;
  currency: string;
  label: string;
  date: string;
  orderId: string | null;
  /** Distinguish wallet_tx from payment when id might overlap */
  kind: "wallet_tx" | "payment";
};

const SOURCE_LABELS: Record<TransactionSource, string> = {
  wallet: "Wallet",
  paystack: "Paystack",
  stripe: "Stripe",
};

export default function DashboardWalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [filter, setFilter] = useState<TransactionSource | "all">("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const [
          { data: p },
          { data: walletTx },
          { data: payments },
        ] = await Promise.all([
          supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
          supabase
            .from("wallet_transactions")
            .select("id, amount, type, reference_id, description, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("payments")
            .select("id, amount, currency, payment_method, order_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        setBalance(p?.wallet_balance ?? 0);

        const list: UnifiedTransaction[] = [];

        (walletTx ?? []).forEach((t: { id: string; amount: number; type: string; reference_id: string | null; description: string | null; created_at: string }) => {
          const label = t.description?.trim() || (t.type === "debit" ? "Payment" : t.type === "credit" ? "Refund / Credit" : t.type);
          list.push({
            id: `wt-${t.id}`,
            source: "wallet",
            amount: Number(t.amount),
            currency: "GHS",
            label,
            date: t.created_at,
            orderId: t.reference_id ?? null,
            kind: "wallet_tx",
          });
        });

        (payments ?? []).forEach((p: { id: string; amount: number; currency: string; payment_method: string; order_id: string | null; created_at: string }) => {
          const method = p.payment_method as TransactionSource;
          if (method !== "wallet" && method !== "paystack" && method !== "stripe") return;
          list.push({
            id: `pay-${p.id}`,
            source: method,
            amount: -Number(p.amount),
            currency: p.currency || "GHS",
            label: "Order payment",
            date: p.created_at,
            orderId: p.order_id ?? null,
            kind: "payment",
          });
        });

        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(list.slice(0, 50));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.source === filter);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-32 rounded-2xl mb-6" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-6">Wallet</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8"
      >
        <p className="text-white/80 mb-1">Available balance</p>
        <p className="text-4xl font-display font-bold">{formatPrice(balance ?? 0, "GHS")}</p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent transactions</h3>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(["all", "wallet", "paystack", "stripe"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium transition ${
                filter === f
                  ? "bg-primary-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All" : SOURCE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
          {transactions.length === 0 ? "No transactions yet." : `No ${filter === "all" ? "" : SOURCE_LABELS[filter] + " "}transactions.`}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {t.source === "wallet" ? (
                    <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : t.source === "paystack" ? (
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{t.label}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)}</span>
                    {t.source !== "all" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {SOURCE_LABELS[t.source]}
                      </span>
                    )}
                    {t.orderId && (
                      <Link
                        href={`/dashboard/orders/${t.orderId}/receipt`}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        View order <ArrowRightLeft className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <p className={`font-semibold shrink-0 ${t.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {t.amount >= 0 ? "+" : ""}
                {formatPrice(t.amount, t.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
