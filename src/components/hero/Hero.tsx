"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { HeroSlide } from "@/types";
import { Shield, Truck, Sparkles } from "lucide-react";

const AUTO_SCROLL_INTERVAL = 5000;

const trustBadges = [
  { icon: Shield, text: "Authentic products" },
  { icon: Truck, text: "Secure payments" },
  { icon: Sparkles, text: "Fast delivery" },
];

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
  subtitle = "Perfumes, sneakers, electronics & accessories sourced globally.",
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

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 400], [0, 60]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[60vh] md:min-h-[65vh] flex items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl mx-4 mb-10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
    >
      {/* Background */}
      <motion.div className="absolute inset-0" style={{ y: backgroundY }}>
        {hasSlides && bgImage ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide?.id ?? "fallback"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
          </AnimatePresence>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundColor: !backgroundImage ? undefined : "transparent",
            }}
          />
        )}
      </motion.div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(5,150,105,0.92) 0%, rgba(4,120,87,0.88) 50%, rgba(2,44,34,0.9) 100%)",
        }}
      />
      {bgImage && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      )}

      <div className="relative z-10 text-center px-6 py-14 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide?.id ?? "static"}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="hero-title text-white mb-4 drop-shadow-sm">
              {displayTitle}
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              {displaySubtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Floating CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
        >
          <Link href={primaryLink}>
            <motion.span
              className="btn-accent inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold shadow-lg"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {ctaText}
            </motion.span>
          </Link>
          <Link href={secondaryCtaHref}>
            <motion.span
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold border-2 border-white/40 bg-white/15 text-white hover:bg-white/25 hover:border-white/60 backdrop-blur-sm transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {secondaryCtaText}
            </motion.span>
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/90 text-sm"
        >
          {trustBadges.map(({ icon: Icon, text }, i) => (
            <motion.span
              key={text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-center gap-2"
            >
              <Icon className="w-5 h-5 text-white/90" />
              <span>✓ {text}</span>
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Dot indicators */}
      {hasSlides && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "w-8 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      )}

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 bg-white/70 rounded-full" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
