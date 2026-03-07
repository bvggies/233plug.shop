"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!isSupabaseConfigured()) {
      toast.error("Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (typeof msg === "string" && msg.toLowerCase().includes("fetch")) {
        toast.error("Cannot reach authentication server. Check your connection and that Supabase env vars are set in Vercel.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/80">
      <div className="h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-b-[2rem]" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 -mt-32 px-4 pb-8">
        <div className="surface-card overflow-hidden">
          <div className="pt-8 pb-6 px-6 text-center">
            <Link href="/" className="inline-block mb-4">
              <Logo size="lg" className="justify-center" />
            </Link>
            <h1 className="text-xl font-display font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-8 space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input {...register("email")} type="email" placeholder="Email" className="input-base pl-12" />
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-red-500 px-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input {...register("password")} type="password" placeholder="Password" className="input-base pl-12" />
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-500 px-1">{errors.password.message}</p>}
            </div>
            <Link href="/forgot-password" className="block text-sm text-primary-600 font-medium text-right py-2">Forgot password?</Link>
            <motion.button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign in</span><ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </form>
        </div>
        <p className="mt-6 text-center text-gray-500 text-sm">Don&apos;t have an account? <Link href="/signup" className="text-primary-600 font-semibold">Sign up</Link></p>
      </motion.div>
    </div>
  );
}
