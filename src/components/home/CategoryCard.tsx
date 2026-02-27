"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string;
  color: string;
}

export function CategoryCard({ name, slug, color }: CategoryCardProps) {
  return (
    <Link href={`/shop?category=${slug}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        className={`relative aspect-square rounded-2xl bg-gradient-to-br ${color} flex items-end p-4 overflow-hidden shadow-soft`}
      >
        <h3 className="text-white font-display font-semibold text-lg relative z-10">
          {name}
        </h3>
      </motion.div>
    </Link>
  );
}
