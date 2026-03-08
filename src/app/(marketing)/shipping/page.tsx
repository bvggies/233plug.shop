"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/ui/PageHero";
import { Truck, ArrowLeft } from "lucide-react";
import type { SitePage } from "@/types";

const DEFAULT_SHIPPING_TITLE = "Shipping Policy";

const FALLBACK_SHIPPING_CONTENT = `## Delivery within Ghana

We ship to all regions in Ghana. Orders are typically processed within 1–2 business days after payment confirmation.

- **Standard delivery**: 5–10 business days
- **Free shipping** on orders over GHS 500
- Orders below GHS 500 may incur a delivery fee at checkout

You will receive tracking updates (where available) so you can follow your order.

## International shipping

International shipping is available on request. Contact us before placing your order so we can confirm availability and provide a shipping quote for your location.

## Shipping address

Please ensure your delivery address and contact number are correct at checkout. We are not responsible for failed or delayed delivery due to incorrect or incomplete address details.

## Lost or damaged items

If your order arrives damaged or does not arrive within the expected timeframe, contact us with your order number and we will work to resolve the issue.`;

export default function ShippingPolicyPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "shipping")
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

  const title = page.title || DEFAULT_SHIPPING_TITLE;
  const hasContent = page.content?.trim();

  return (
    <div className="min-h-screen">
      <PageHero
        title={title}
        subtitle={page.meta_description ?? undefined}
        imageUrl="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&q=80"
        icon={<Truck className="w-10 h-10 text-white" />}
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
            <ContentRenderer content={FALLBACK_SHIPPING_CONTENT} />
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
