"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/ui/PageHero";
import type { SitePage } from "@/types";

export default function ContactPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "contact")
        .single();
      setPage(data as SitePage);
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await createClient()
        .from("contact_submissions")
        .insert({
          name: form.name,
          email: form.email,
          subject: form.subject || null,
          message: form.message,
        });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-48 mb-8 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const contactEmail = page?.contact_email;
  const contactPhone = page?.contact_phone;
  const contactAddress = page?.contact_address;
  const title = page?.title ?? "Contact Us";
  const subtitle = page?.meta_description ?? "Get in touch with our team. We're here to help.";

  return (
    <div className="min-h-screen">
      <PageHero
        title={title}
        subtitle={subtitle}
        imageUrl="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&q=80"
        icon={
          <div className="inline-flex items-center gap-3 p-4 bg-white/20 rounded-2xl backdrop-blur-sm ring-2 ring-white/30">
            <Image src="/logo.png" alt="233Plug" width={56} height={56} className="object-contain flex-shrink-0" priority />
            <MessageSquare className="w-8 h-8 text-white flex-shrink-0" aria-hidden />
          </div>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-5xl mx-auto px-4 pb-20 -mt-2"
      >
        {/* Branded strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="flex items-center justify-center gap-4 py-5 mb-2"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800/80 shadow-soft border border-gray-100 dark:border-gray-700/50">
            <Image src="/logo.png" alt="233Plug" width={40} height={40} className="object-contain" />
            <span className="font-display font-semibold text-gray-900 dark:text-gray-100">We&apos;re here to help</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Contact info cards */}
          {(contactEmail || contactPhone || contactAddress) && (
            <div className="md:col-span-1 space-y-4">
              {contactEmail && (
                <motion.a
                  href={`mailto:${contactEmail}`}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-5 surface-card-hover group"
                >
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Email</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5 break-all">{contactEmail}</p>
                  </div>
                </motion.a>
              )}
              {contactPhone && (
                <motion.a
                  href={`tel:${contactPhone}`}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-5 surface-card-hover group"
                >
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{contactPhone}</p>
                  </div>
                </motion.a>
              )}
              {contactAddress && (
                <motion.div
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-5 surface-card"
                >
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Address</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{contactAddress}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${contactEmail || contactPhone || contactAddress ? "md:col-span-2" : "md:col-span-3"} surface-card p-8`}
          >
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-6">
              Send a message
            </h2>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="input-base"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="input-base"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us what you need..."
                  className="input-base resize-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-6 w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending..." : "Send message"}
            </button>
          </motion.form>
        </div>
      </motion.section>
    </div>
  );
}
