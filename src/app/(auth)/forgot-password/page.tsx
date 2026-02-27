"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your email for the reset link");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <div className="h-40 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-b-[2rem]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 -mt-24 px-4 pb-8"
      >
        <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="pt-8 pb-6 px-6 text-center">
            <h1 className="text-xl font-display font-bold text-gray-900">Forgot password?</h1>
            <p className="text-gray-500 text-sm mt-1">
              {sent ? "We sent a link to your email." : "Enter your email to get a reset link."}
            </p>
          </div>
          {!sent ? (
            <form onSubmit={handleSubmit} className="px-6 pb-8">
              <div className="relative mb-6">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-4 bg-primary-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send reset link</>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="px-6 pb-8">
              <button
                onClick={() => setSent(false)}
                className="w-full py-4 px-4 border-2 border-primary-500 text-primary-500 font-semibold rounded-2xl"
              >
                Try another email
              </button>
            </div>
          )}
        </div>
        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm hover:text-primary-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </motion.div>
    </div>
  );
}
