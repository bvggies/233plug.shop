"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FAQ } from "@/types";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });
      const list = (data as FAQ[]) ?? [];
      setFaqs(list);
      if (list[0]?.id) setOpenId(list[0].id);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-48 mb-8 rounded-xl" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-4 md:mx-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-16 md:py-20 px-6 shadow-lg"
        >
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
              Find answers to common questions about 233Plug.
            </p>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 pb-20 -mt-2"
      >
        {faqs.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No FAQs yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Check back soon or reach out directly.</p>
            <Link href="/contact" className="btn-primary">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="surface-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100 pr-4">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 md:px-6 md:pb-6 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Still have questions?</p>
          <Link href="/contact" className="btn-primary">
            Contact us
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
