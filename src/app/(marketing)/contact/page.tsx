"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
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
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const contactEmail = page?.contact_email;
  const contactPhone = page?.contact_phone;
  const contactAddress = page?.contact_address;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {page?.title ?? "Contact Us"}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {page?.content ?? "Get in touch with our team."}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-5xl mx-auto px-4 py-16 -mt-8"
      >
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact info cards */}
          {(contactEmail || contactPhone || contactAddress) && (
            <div className="md:col-span-1 space-y-4">
              {contactEmail && (
                <motion.a
                  href={`mailto:${contactEmail}`}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-soft hover:shadow-soft-lg transition"
                >
                  <div className="p-2 bg-primary-50 rounded-xl">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600 text-sm">{contactEmail}</p>
                  </div>
                </motion.a>
              )}
              {contactPhone && (
                <motion.a
                  href={`tel:${contactPhone}`}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-soft hover:shadow-soft-lg transition"
                >
                  <div className="p-2 bg-primary-50 rounded-xl">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600 text-sm">{contactPhone}</p>
                  </div>
                </motion.a>
              )}
              {contactAddress && (
                <motion.div
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-soft"
                >
                  <div className="p-2 bg-primary-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p className="text-gray-600 text-sm">{contactAddress}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`${contactEmail || contactPhone || contactAddress ? "md:col-span-2" : "md:col-span-3"} p-8 rounded-2xl bg-white border border-gray-100 shadow-soft`}
          >
            <h3 className="text-xl font-display font-bold text-gray-900 mb-6">
              Send a message
            </h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending..." : "Send message"}
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
