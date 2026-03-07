"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { HeroSlide } from "@/types";

const AUTO_SCROLL_INTERVAL = 5000;

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundImage?: string;
}

export function Hero({
  title = "Shop Premium Products",
  subtitle = "Perfumes, sneakers, electronics & accessories. Request-to-buy sourcing from Ghana.",
  ctaText = "Shop Now",
  ctaHref = "/shop",
  secondaryCtaText = "Request an Item",
  secondaryCtaHref = "/request",
  backgroundImage,
}: HeroProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("hero_slides")
          .select("*")
          .order("sort_order", { ascending: true });
        setSlides((data as HeroSlide[]) ?? []);
      } catch {
        setSlides([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  const hasSlides = slides.length > 0;
  const currentSlide = hasSlides ? slides[activeIndex] : null;

  const displayTitle = currentSlide?.title ?? title;
  const displaySubtitle = currentSlide?.subtitle ?? subtitle;
  const primaryLink = currentSlide?.link_url ?? ctaHref;
  const bgImage = currentSlide?.image_url ?? backgroundImage;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[58vh] flex items-center justify-center overflow-hidden rounded-2xl mx-4 mb-10 shadow-xl"
    >
      {/* Background images - stacked for transitions */}
      <div className="absolute inset-0">
        {hasSlides ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide?.id ?? "fallback"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
              style={{
                backgroundImage: bgImage
                  ? `linear-gradient(135deg, rgba(11,61,46,0.88) 0%, rgba(11,61,46,0.78) 100%), url(${bgImage})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </AnimatePresence>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700"
            style={{
              backgroundImage: backgroundImage
                ? `linear-gradient(135deg, rgba(11,61,46,0.92) 0%, rgba(11,61,46,0.75) 100%), url(${backgroundImage})`
                : undefined,
              backgroundSize: "cover",
            }}
          />
        )}
      </div>

      {/* Single gradient overlay when no image */}
      {!bgImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/90 via-primary-600/85 to-primary-700/90 pointer-events-none" />
      )}

      <div className="relative z-10 text-center px-6 py-14 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide?.id ?? "static"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              {displaySubtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href={primaryLink}>
            <motion.span
              className="btn-accent inline-block"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {ctaText}
            </motion.span>
          </Link>
          <Link href={secondaryCtaHref}>
            <motion.span
              className="btn-secondary inline-block border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/40"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {secondaryCtaText}
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Dot indicators */}
      {hasSlides && slides.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-9 rounded-full border-2 border-white/40 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-1.5 bg-white/70 rounded-full" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
