"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Truck,
  Shield,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { toast } from "sonner";

const categories = [
  { name: "Perfumes", href: "/shop?category=perfumes" },
  { name: "Sneakers", href: "/shop?category=sneakers" },
  { name: "Electronics", href: "/shop?category=electronics" },
  { name: "Accessories", href: "/shop?category=accessories" },
];

const links = [
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Request Item", href: "/request" },
];

const social = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "On orders over GHS 500",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    desc: "Paystack & Stripe",
  },
  {
    icon: Sparkles,
    title: "Quality Assured",
    desc: "Sourced with care",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, staggerDirection: 1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`group relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute bottom-0 left-0 h-px bg-accent-400"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.2 }}
      />
    </Link>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSubscribing(true);
    setTimeout(() => {
      toast.success("Thanks for subscribing!");
      setEmail("");
      setSubscribing(false);
    }, 800);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 mt-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-neutral-900 to-neutral-950 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(5,150,105,0.12),transparent)]" />

      {/* Feature strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative -mt-16 mx-4 md:mx-6 lg:mx-auto lg:max-w-5xl mb-0"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="flex items-center gap-4 p-4 lg:p-5 rounded-2xl lg:rounded-3xl surface-card hover:shadow-card-hover transition-all"
            >
              <div className="p-2.5 lg:p-3 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                <f.icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm lg:text-base">{f.title}</p>
                <p className="text-description text-xs lg:text-sm">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-10 lg:pb-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-10"
        >
          {/* Brand column */}
          <motion.div variants={itemVariants} className="lg:col-span-5">
            <Link href="/" className="inline-block mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="inline-flex p-3 lg:p-4 rounded-2xl bg-white/10 ring-2 ring-white/20"
              >
                <Logo variant="dark" size="lg" asLink={false} />
              </motion.div>
            </Link>
            <p className="text-neutral-400 text-sm lg:text-base leading-relaxed mb-6 max-w-sm">
              Premium e-commerce platform. Shop perfumes, sneakers, electronics &
              accessories. Request-to-buy sourcing from Ghana.
            </p>
            <div className="flex gap-3">
              {social.map(({ icon: Icon, href, label }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl bg-neutral-800/80 text-neutral-400 hover:bg-primary-500/20 hover:text-accent-400 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h3 className="section-title text-white mb-4 lg:mb-5 text-lg lg:text-xl">
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <AnimatedLink
                    href={cat.href}
                    className="text-neutral-400 hover:text-accent-400 text-sm lg:text-base transition-colors"
                  >
                    {cat.name}
                  </AnimatedLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h3 className="section-title text-white mb-4 lg:mb-5 text-lg lg:text-xl">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <AnimatedLink
                    href={link.href}
                    className="text-neutral-400 hover:text-accent-400 text-sm lg:text-base transition-colors"
                  >
                    {link.name}
                  </AnimatedLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <h3 className="section-title text-white mb-4 lg:mb-5 text-lg lg:text-xl">
              Newsletter
            </h3>
            <p className="text-sm lg:text-base text-neutral-400 mb-4">
              Subscribe for updates and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 lg:py-3.5 pr-12 rounded-xl lg:rounded-2xl bg-neutral-800/80 dark:bg-neutral-800/60 border border-neutral-700/50 text-white placeholder-neutral-500 focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={subscribing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-500 text-white hover:bg-accent-400 transition disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 lg:mt-20 pt-8 lg:pt-10 border-t border-neutral-800/80 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-sm lg:text-base text-neutral-500">
            © {new Date().getFullYear()} 233Plug. All rights reserved.
          </p>
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/terms"
              className="text-sm lg:text-base text-neutral-500 hover:text-neutral-400 transition"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm lg:text-base text-neutral-500 hover:text-neutral-400 transition"
            >
              Privacy
            </Link>
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-accent-400 hover:bg-neutral-800 transition"
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">Back to top</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
