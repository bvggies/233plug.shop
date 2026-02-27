"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, MapPin, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Address {
  id: string;
  label: string;
  address: string;
  city: string | null;
  country: string;
  phone: string | null;
  is_default: boolean;
}

export default function DashboardAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data } = await supabase
          .from("addresses")
          .select("id, label, address, city, country, phone, is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });
        setAddresses((data as Address[]) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <Skeleton className="h-10 w-32 rounded mb-6" />
        <Skeleton className="h-32 rounded-2xl mb-4" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/profile"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-display font-bold text-gray-900">Addresses</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">No addresses yet</p>
            <p className="text-sm text-gray-500 mb-6">Add an address for faster checkout</p>
            <Link
              href="/dashboard/addresses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600"
            >
              <Plus className="w-4 h-4" />
              Add address
            </Link>
          </div>
        ) : (
          <>
            {addresses.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{a.label}</span>
                      {a.is_default && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{a.address}</p>
                    {a.city && (
                      <p className="text-sm text-gray-500">{a.city}, {a.country}</p>
                    )}
                    {a.phone && (
                      <p className="text-sm text-gray-500 mt-0.5">{a.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Link
              href="/dashboard/addresses/new"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-600 font-medium hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add new address
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
