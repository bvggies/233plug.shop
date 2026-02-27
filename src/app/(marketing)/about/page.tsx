"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SitePage } from "@/types";

export default function AboutPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "about")
        .single();
      setPage(data as SitePage);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Page not found.</p>
        <Link href="/" className="text-primary-500 hover:underline mt-4 inline-block">
          Go home
        </Link>
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
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {page.title}
          </h1>
          {page.meta_description && (
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              {page.meta_description}
            </p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl mx-auto px-4 py-16 -mt-8"
      >
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 md:p-12">
          {page.content ? (
            <ContentRenderer content={page.content} />
          ) : (
            <p className="text-gray-500">No content yet.</p>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
          >
            Shop now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
