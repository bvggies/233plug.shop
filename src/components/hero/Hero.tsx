"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden rounded-3xl mx-4 mb-8"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700"
        style={{
          backgroundImage: backgroundImage
            ? `linear-gradient(135deg, rgba(11,61,46,0.9) 0%, rgba(11,61,46,0.7) 100%), url(${backgroundImage})`
            : undefined,
          backgroundSize: "cover",
        }}
      />

      <div className="relative z-10 text-center px-6 py-16 max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-6xl font-display font-bold text-white mb-4"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg md:text-xl text-white/90 mb-8"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={ctaHref}>
            <motion.span
              className="inline-block px-8 py-3 bg-accent-500 text-white font-medium rounded-xl hover:bg-accent-600 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {ctaText}
            </motion.span>
          </Link>
          <Link href={secondaryCtaHref}>
            <motion.span
              className="inline-block px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-medium rounded-xl border border-white/30 hover:bg-white/30 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {secondaryCtaText}
            </motion.span>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/80 rounded-full" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
