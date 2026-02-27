"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });
      if (error) throw error;
      toast.success("Account created! Check your email to verify.");
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
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
        transition={{ duration: 0.4 }}
        className="flex-1 -mt-24 px-4 pb-8"
      >
        <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="pt-8 pb-6 px-6 text-center">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/233plug-logo.png"
                alt="233Plug"
                width={100}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <h1 className="text-xl font-display font-bold text-gray-900">
              Create account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Join 233Plug to start shopping
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-8 space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Full name"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500 px-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500 px-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Password (min 6 characters)"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500 px-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Confirm password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-500 px-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-4 bg-primary-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-500 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
