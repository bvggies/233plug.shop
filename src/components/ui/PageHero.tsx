"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type PageHeroProps = {
  title: string;
  subtitle?: string | null;
  /** Optional hero image URL (e.g. Unsplash). Shown as background with overlay. */
  imageUrl?: string | null;
  /** Optional icon or element above the title */
  icon?: React.ReactNode;
};

export function PageHero({ title, subtitle, imageUrl, icon }: PageHeroProps) {
  return (
    <section className="mx-4 md:mx-6 mb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-16 md:py-20 px-6 shadow-lg min-h-[220px] md:min-h-[260px] flex items-center justify-center"
      >
        {/* Background image */}
        {imageUrl && (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
              />
            </div>
            <div
              className="absolute inset-0 z-[1] bg-gradient-to-br from-primary-600/92 via-primary-700/88 to-primary-800/92"
              aria-hidden
            />
          </>
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {icon && (
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4">
              {icon}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
