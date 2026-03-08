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
  { name: "Shipping Policy", href: "/shipping" },
  { name: "Refunds & Returns", href: "/refunds" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Request Item", href: "/request" },
];

const social = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over GHS 500" },
  { icon: Shield, title: "Secure Payment", desc: "Paystack & Stripe" },
  { icon: Sparkles, title: "Quality Assured", desc: "Sourced with care" },
];

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative z-20 mt-24 overflow-hidden">
      {/* Background – modern dark with subtle grain */}
      <div className="absolute inset-0 bg-neutral-950 dark:bg-neutral-950" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_50%,rgba(5,150,105,0.03)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-20%,rgba(5,150,105,0.08),transparent_50%)]" />

      {/* Feature strip – glass cards */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative z-10 -mt-20 mx-4 sm:mx-6 lg:mx-auto lg:max-w-4xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="group flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white/5 dark:bg-white/[0.04] border border-white/10 dark:border-white/5 backdrop-blur-sm hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
            >
              <div className="flex shrink-0 w-11 h-11 rounded-xl bg-primary-500/15 dark:bg-primary-500/20 text-primary-400 flex items-center justify-center group-hover:bg-primary-500/25 transition-colors">
                <f.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-neutral-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 lg:pt-20 pb-12 lg:pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <span className="flex p-2 rounded-xl bg-white/10 border border-white/10">
                <Logo variant="dark" size="lg" asLink={false} />
              </span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mb-6">
              Premium e-commerce. Perfumes, sneakers, electronics & accessories. Request-to-buy from Ghana.
            </p>
            <div className="flex gap-2">
              {social.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/10 flex items-center justify-center transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Updates and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="shrink-0 h-11 px-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Join</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 lg:mt-14 pt-6 lg:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500 order-2 sm:order-1">
            © {new Date().getFullYear()} 233Plug. All rights reserved.
          </p>
          <div className="flex items-center gap-6 order-1 sm:order-2">
            <Link
              href="/terms"
              className="text-xs text-neutral-500 hover:text-neutral-400 transition"
            >
              Terms
            </Link>
            <Link
              href="/shipping"
              className="text-xs text-neutral-500 hover:text-neutral-400 transition"
            >
              Shipping
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-neutral-500 hover:text-neutral-400 transition"
            >
              Privacy
            </Link>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowUp className="w-4 h-4" />
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
