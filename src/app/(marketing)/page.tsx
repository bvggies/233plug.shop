"use client";

import { Hero } from "@/components/hero/Hero";
import { CategoryCard } from "@/components/home/CategoryCard";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { motion } from "framer-motion";

const categories = [
  { name: "Perfumes", slug: "perfumes", image: "/categories/perfumes.jpg", color: "from-pink-400 to-rose-500" },
  { name: "Sneakers", slug: "sneakers", image: "/categories/sneakers.jpg", color: "from-blue-400 to-indigo-500" },
  { name: "Electronics", slug: "electronics", image: "/categories/electronics.jpg", color: "from-slate-400 to-slate-600" },
  { name: "Accessories", slug: "accessories", image: "/categories/accessories.jpg", color: "from-amber-400 to-orange-500" },
];

export default function HomePage() {
  return (
    <div>
      <Hero
        title="Shop Premium Products"
        subtitle="Perfumes, sneakers, electronics & accessories. Request-to-buy sourcing from Ghana."
        ctaText="Shop Now"
        ctaHref="/shop"
        secondaryCtaText="Request an Item"
        secondaryCtaHref="/request"
      />

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-display font-bold text-gray-900 mb-8"
        >
          Shop by Category
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <CategoryCard {...cat} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
        >
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Featured Products
          </h2>
          <CountdownTimer />
        </motion.div>
        <ProductCarousel />
      </section>

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-display font-bold text-gray-900 mb-8"
        >
          Trending & Requested
        </motion.h2>
        <ProductCarousel />
      </section>
    </div>
  );
}
