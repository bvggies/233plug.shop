"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardWalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ id: string; amount: number; type: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const [{ data: p }, { data: t }] = await Promise.all([
          supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
          supabase.from("wallet_transactions").select("id, amount, type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        ]);
        setBalance(p?.wallet_balance ?? 0);
        setTransactions(t || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

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
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Wallet</h1>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8">
        <p className="text-white/80 mb-1">Available balance</p>
        <p className="text-4xl font-display font-bold">{formatPrice(balance ?? 0, "GHS")}</p>
      </motion.div>
      <h3 className="font-semibold text-gray-900 mb-4">Recent transactions</h3>
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500">No transactions yet.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium capitalize">{t.type}</p>
                <p className="text-sm text-gray-500">{formatDate(t.created_at)}</p>
              </div>
              <p className={`font-semibold ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>{t.amount >= 0 ? "+" : ""}{formatPrice(t.amount, "GHS")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
