"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  product_name: z.string().min(2, "Product name is required"),
  link_or_image: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional().default(""),
  description: z.string(),
  budget: z.coerce.number().min(0).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const steps = [
  { id: 1, title: "Product Details" },
  { id: 2, title: "Description & Budget" },
];

export default function RequestPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", link_or_image: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to submit a request");
        router.push("/login?redirect=/request");
        return;
      }
      const { error } = await supabase.from("requests").insert({
        user_id: user.id,
        product_name: data.product_name,
        link_or_image: data.link_or_image || "https://placeholder.com",
        description: data.description || null,
        budget: data.budget || null,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Request submitted! We'll get back to you soon.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    const fields = step === 1 ? ["product_name", "link_or_image"] : ["description", "budget"];
    const valid = await trigger(fields as (keyof FormData)[]);
    if (valid) setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Request to Buy
        </h1>
        <p className="text-gray-500">
          Can&apos;t find what you want? Tell us and we&apos;ll source it for you.
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded-full ${
              s.id <= step ? "bg-primary-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="glass-card p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product name *
                </label>
                <input
                  {...register("product_name")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Nike Air Max 90"
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.product_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product link or image URL
                </label>
                <input
                  {...register("link_or_image")}
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                />
                {errors.link_or_image && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.link_or_image.message}
                  </p>
                )}
              </div>
              <Button type="button" onClick={nextStep} fullWidth>
                Next
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Size, color, any specific details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (GHS)
                </label>
                <input
                  {...register("budget", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  fullWidth
                >
                  Back
                </Button>
                <Button type="submit" loading={loading} fullWidth>
                  Submit Request
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
