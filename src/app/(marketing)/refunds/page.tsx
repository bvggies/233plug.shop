"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/ui/PageHero";
import { RefreshCw, ArrowLeft } from "lucide-react";
import type { SitePage } from "@/types";

const DEFAULT_REFUNDS_TITLE = "Refunds & Returns";

const FALLBACK_REFUNDS_CONTENT = `## Overview

At 233Plug we want you to be satisfied with your purchase. Please read this policy carefully so you understand when refunds and returns are possible.

## Items that have been shipped

**Once an item has been shipped, we do not offer refunds** unless we are able to find another buyer for the same item. In that case we may, at our discretion, process a refund after the item is returned to us and resold. Contact us with your order number if you believe this may apply to your situation.

## Requested / custom-sourced items

**Items that were requested through our Request-to-Buy service are not eligible for refunds or returns.** These are sourced specifically for you based on your request. By placing a request and accepting a quote, you agree that requested items are final sale.

## Before shipment

If you need to cancel or change your order before it has been shipped, contact us as soon as possible. We will do our best to accommodate you depending on order status.

## Damaged or incorrect items

If you receive an item that is damaged or not what you ordered, contact us with your order number and photos. We will work with you to resolve the issue, which may include replacement or a refund where appropriate.

## How to contact us

For any refund or return enquiry, use our [Contact](/contact) page with your order number and details. We will respond as quickly as we can.`;

export default function RefundsPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "refunds")
        .single();
      setPage(data as SitePage);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-64 mb-6 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Page not found.</p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    );
  }

  const title = page.title || DEFAULT_REFUNDS_TITLE;
  const hasContent = page.content?.trim();

  return (
    <div className="min-h-screen">
      <PageHero
        title={title}
        subtitle={page.meta_description ?? undefined}
        imageUrl="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80"
        icon={<RefreshCw className="w-10 h-10 text-white" />}
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 pb-20 -mt-2"
      >
        <div className="surface-card p-8 md:p-12">
          {hasContent ? (
            <ContentRenderer content={page.content!} />
          ) : (
            <ContentRenderer content={FALLBACK_REFUNDS_CONTENT} />
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <Link href="/contact" className="btn-primary">
            Contact us
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
