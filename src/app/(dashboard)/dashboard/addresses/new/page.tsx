"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export default function NewAddressPage() {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !address.trim()) {
      toast.error("Label and address are required");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (isDefault) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: label.trim(),
        address: address.trim(),
        city: city.trim() || null,
        country: "Ghana",
        phone: phone.trim() || null,
        is_default: isDefault,
      });
      if (error) throw error;
      toast.success("Address added");
      router.push("/dashboard/addresses");
      router.refresh();
    } catch {
      toast.error("Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/addresses"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-display font-bold text-gray-900">Add address</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Label (e.g. Home, Office)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Home"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Street, area, landmark..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Accra"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="0244 000 000"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Set as default address</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save address"}
        </button>
      </form>
    </div>
  );
}
