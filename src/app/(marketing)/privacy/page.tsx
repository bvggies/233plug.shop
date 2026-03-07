"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Shield, ArrowLeft } from "lucide-react";
import type { SitePage } from "@/types";

const DEFAULT_PRIVACY_TITLE = "Privacy Policy";

const FALLBACK_PRIVACY_CONTENT = `## Introduction

233Plug ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our website and services.

## Information we collect

- **Account and profile data**: Name, email address, and delivery address when you register or place an order.
- **Order and payment data**: Order details and payment information processed securely via Paystack and Stripe. We do not store full card numbers.
- **Usage data**: How you use our site (e.g. pages visited, device type) to improve our service and security.

## How we use your information

We use your information to process orders, send order and shipping updates, respond to enquiries, improve our website and products, and comply with legal obligations. We do not sell your personal data to third parties.

## Cookies and similar technologies

We use cookies and similar technologies to keep you signed in, remember preferences, and understand how our site is used. You can control cookies through your browser settings.

## Data security

We use industry-standard measures to protect your data, including encryption and secure connections. Payment data is handled by our certified payment providers.

## Your rights

Depending on your location, you may have the right to access, correct, or delete your personal data, or to object to or restrict certain processing. To exercise these rights, contact us using the details on our Contact page.

## Changes to this policy

We may update this policy from time to time. We will post the updated policy on this page and, where appropriate, notify you by email or through our site.

## Contact

For privacy-related questions or requests, please use our Contact page or the email address provided there.`;

export default function PrivacyPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "privacy")
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
        <p className="text-gray-500 dark:text-gray-400 mb-6">Page not found.</p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    );
  }

  const title = page.title || DEFAULT_PRIVACY_TITLE;
  const hasContent = page.content?.trim();

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
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">
              {title}
            </h1>
            {page.meta_description && (
              <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
                {page.meta_description}
              </p>
            )}
          </div>
        </motion.div>
      </section>

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
            <ContentRenderer content={FALLBACK_PRIVACY_CONTENT} />
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
