"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface FormData {
  name: string;
  phone: string;
  address: string;
}

export default function DashboardProfilePage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { register, handleSubmit, setValue } = useForm<FormData>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .select("name, phone, address")
        .eq("id", data.user.id)
        .single()
        .then(({ data: p }) => {
          if (p) {
            setValue("name", p.name || "");
            setValue("phone", p.phone || "");
            setValue("address", p.address || "");
          }
        });
    });
  }, [supabase, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq("id", user.id);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
        Profile
      </h1>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-lg space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full name
          </label>
          <input
            {...register("name")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            {...register("phone")}
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            {...register("address")}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button type="submit" loading={loading}>
          Save changes
        </Button>
      </motion.form>
    </div>
  );
}
