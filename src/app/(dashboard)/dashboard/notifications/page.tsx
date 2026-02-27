"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; read: boolean; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data } = await supabase.from("notifications").select("id, type, message, read, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
        setNotifications(data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500">No notifications yet.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-4 ${n.read ? "bg-gray-50" : "bg-primary-50 border border-primary-100"}`}>
              <p className="font-medium text-gray-900">{n.message}</p>
              <p className="text-sm text-gray-500">{formatDate(n.created_at)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
