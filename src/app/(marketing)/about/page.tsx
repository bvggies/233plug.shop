"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/ui/PageHero";
import { Sparkles, Truck, Shield, Heart, ArrowRight } from "lucide-react";
import type { SitePage } from "@/types";

const DEFAULT_ABOUT = {
  title: "About 233Plug",
  description: "Your trusted partner for premium products, sourced with care from Ghana to your door.",
  content: null as string | null,
};

const FALLBACK_CONTENT = (
  <div className="space-y-8 text-gray-600 dark:text-gray-300">
    <p className="text-lg leading-relaxed">
      <strong className="text-gray-900 dark:text-gray-100">233Plug</strong> is a premium e‑commerce platform bringing you curated perfumes, sneakers, electronics, and accessories. We combine a hand-picked shop with a <strong className="text-gray-900 dark:text-gray-100">request-to-buy</strong> service—if we don’t stock it, you can request it and we’ll source it for you.
    </p>

    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4">
      Our mission
    </h2>
    <p className="leading-relaxed">
      We aim to make quality products accessible with transparent pricing, reliable shipping, and a focus on customer trust. Every order is handled with care from sourcing to delivery.
    </p>

    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4">
      Why shop with us
    </h2>
    <ul className="grid sm:grid-cols-2 gap-4 list-none pl-0">
      {[
        { icon: Truck, title: "Reliable shipping", text: "Secure delivery with tracking on qualifying orders." },
        { icon: Shield, title: "Secure payments", text: "Paystack and Stripe for safe, easy checkout." },
        { icon: Sparkles, title: "Request anything", text: "Can't find it? Request an item and we'll source it." },
        { icon: Heart, title: "Quality assured", text: "Products sourced and checked for authenticity." },
      ].map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary-500/10 dark:bg-primary-500/20">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-sm mt-0.5 text-gray-600 dark:text-gray-300">{text}</p>
          </div>
        </li>
      ))}
    </ul>

    <p className="leading-relaxed pt-4">
      Whether you&apos;re browsing the collection or requesting something special, we&apos;re here to help. Thank you for choosing 233Plug.
    </p>
  </div>
);

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
        <Skeleton className="h-12 w-64 mb-6 rounded-xl" />
        <Skeleton className="h-32 mb-6 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const title = page?.title ?? DEFAULT_ABOUT.title;
  const description = page?.meta_description ?? DEFAULT_ABOUT.description;
  const hasContent = page?.content?.trim();

  return (
    <div className="min-h-screen">
      <PageHero
        title={title}
        subtitle={description}
        imageUrl="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80"
        icon={
          <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur-sm ring-2 ring-white/30">
            <Image src="/logo.png" alt="233Plug" width={72} height={72} className="object-contain" priority />
          </div>
        }
      />

      {/* Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 pb-20 -mt-2"
      >
        <div className="surface-card p-8 md:p-12 overflow-hidden">
          {/* Branded header with logo */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="flex flex-col sm:flex-row items-center gap-6 pb-8 mb-8 border-b border-gray-100 dark:border-gray-700/50"
          >
            <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 dark:from-primary-500/20 dark:to-primary-600/20 p-3 flex items-center justify-center ring-2 ring-primary-500/20">
              <Image src="/logo.png" alt="233Plug" width={80} height={80} className="object-contain w-full h-full" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">233Plug</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your trusted partner for premium products, from Ghana to your door.</p>
            </div>
          </motion.div>

          {hasContent ? (
            <ContentRenderer content={page!.content!} />
          ) : (
            FALLBACK_CONTENT
          )}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/shop" className="btn-primary w-full sm:w-auto">
            Shop now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/request" className="btn-secondary w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            Request an item
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
