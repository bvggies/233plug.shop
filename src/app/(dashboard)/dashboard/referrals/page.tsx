"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardReferralsPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<
    { id: string; commission: number; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const [{ data: p }, { data: r }] = await Promise.all([
          supabase.from("profiles").select("referral_code").eq("id", user.id).single(),
          supabase.from("referrals").select("id, commission, status").eq("referrer_id", user.id),
        ]);
        setReferralCode(p?.referral_code ?? "N/A");
        setReferrals(r || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const totalCommission = referrals.reduce((a, r) => a + r.commission, 0);

  if (loading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
        Referrals
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-8"
      >
        <p className="text-gray-600 mb-2">Your referral code</p>
        <div className="flex items-center gap-4">
          <code className="text-2xl font-mono font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-xl">
            {referralCode}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralCode || "");
            }}
            className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Share your code with friends. Earn commission when they make a purchase!
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <p className="font-semibold text-gray-900 mb-2">
          Total commission earned: {formatPrice(totalCommission, "GHS")}
        </p>
        <p className="text-sm text-gray-500">{referrals.length} referral(s)</p>
      </div>
    </div>
  );
}
