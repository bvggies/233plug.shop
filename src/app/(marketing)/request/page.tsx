"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import { Link2, DollarSign, FileText, ChevronRight, ChevronLeft, Sparkles, ImagePlus, X } from "lucide-react";

const schema = z.object({
  product_name: z.string().min(2, "Product name is required"),
  link_or_image: z.union([z.string().url("Enter a valid URL"), z.string().length(0)]).optional().default(""),
  description: z.string(),
  budget: z.coerce.number().min(0).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const stepConfig = [
  { id: 1, title: "Product Name", icon: FileText },
  { id: 2, title: "Link or Image", icon: Link2 },
  { id: 3, title: "Budget", icon: DollarSign },
  { id: 4, title: "Additional Notes", icon: Sparkles },
];

export default function RequestPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", link_or_image: "" },
  });

  const linkOrImage = watch("link_or_image");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to submit a request");
        router.push("/login?redirect=/request");
        return;
      }
      let linkOrImage = data.link_or_image?.trim() || "";
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("request-images").upload(path, imageFile, { upsert: true });
        if (uploadError) {
          toast.error("Image upload failed. You can add a link instead.");
        } else {
          const { data: urlData } = supabase.storage.from("request-images").getPublicUrl(path);
          linkOrImage = urlData.publicUrl;
        }
      }
      const { error } = await supabase.from("requests").insert({
        user_id: user.id,
        product_name: data.product_name,
        link_or_image: linkOrImage || "https://placeholder.com",
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
    const fieldsByStep: (keyof FormData)[][] = [
      ["product_name"],
      ["link_or_image"],
      ["budget"],
      ["description"],
    ];
    const valid = await trigger(fieldsByStep[step - 1]);
    if (valid && step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if (url && (url.startsWith("http") || url.startsWith("https"))) {
        setValue("link_or_image", url);
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setValue("link_or_image", "");
      }
    },
    [setValue]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setValue("link_or_image", "");
    }
    e.target.value = "";
  }, [setValue]);

  const clearImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }, [imagePreview]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        setValue("link_or_image", text);
      }
    },
    [setValue]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="section-title text-neutral-900 dark:text-neutral-100 mb-2">
          Request to Buy
        </h1>
        <p className="text-description">
          Can&apos;t find what you want? Tell us and we&apos;ll source it for you.
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {stepConfig.map((s) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
              s.id <= step
                ? "bg-gradient-to-r from-primary-500 to-primary-700"
                : "bg-neutral-200 dark:bg-[var(--surface-border)]"
            }`}
          />
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="surface-card p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-float dark:shadow-float"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Product name *
                </label>
                <input
                  {...register("product_name")}
                  className="input-base"
                  placeholder="e.g. Nike Air Max 90"
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.product_name.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={nextStep} className="btn-primary flex-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Product link or image URL
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                    dragOver
                      ? "border-primary-500 bg-primary-500/10 dark:bg-primary-500/20"
                      : "border-neutral-200 dark:border-[var(--surface-border)] bg-neutral-50/50 dark:bg-[var(--surface-card)]"
                  }`}
                >
                  <Link2 className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-500 mb-2" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Paste a link below, or drag & drop a URL or image file here
                  </p>
                  {imagePreview ? (
                    <div className="relative inline-block mt-2">
                      <Image src={imagePreview} alt="Upload preview" width={160} height={128} className="max-h-32 w-auto rounded-xl object-cover border border-neutral-200 dark:border-[var(--surface-border)]" unoptimized />
                      <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600" aria-label="Remove image">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-neutral-200 dark:border-[var(--surface-border)] cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/15 transition-colors">
                      <ImagePlus className="w-5 h-5 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Upload image</span>
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" />
                    </label>
                  )}
                  <input
                    {...register("link_or_image")}
                    type="url"
                    className="input-base max-w-md mx-auto mt-4"
                    placeholder="https://..."
                    disabled={!!imageFile}
                  />
                  {linkOrImage && !imageFile && (
                    <p className="mt-2 text-xs text-primary-600 dark:text-primary-400 truncate max-w-full px-2">
                      ✓ Link added
                    </p>
                  )}
                </div>
                {errors.link_or_image && (
                  <p className="mt-1 text-sm text-red-500">{errors.link_or_image.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Budget (GHS) – optional
                </label>
                <input
                  {...register("budget", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={0.01}
                  className="input-base"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Additional notes
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="input-base resize-none"
                  placeholder="Size, color, any specific details..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
