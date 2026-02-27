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
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4">
            <HelpCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Find answers to common questions about 233Plug.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl mx-auto px-4 py-16 -mt-8"
      >
        {faqs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No FAQs yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-gray-50/50 transition"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    className="flex-shrink-0 text-gray-500"
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
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-gray-600 border-t border-gray-100">
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
          <p className="text-gray-500 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
          >
            Contact us
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
