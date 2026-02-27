"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const BANNER_KEY = "233plug-announcement-dismissed";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(BANNER_KEY)) setDismissed(true);
      else setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 text-sm">
            <span className="font-medium">
              Free shipping on orders over GHS 500 — Shop now!
            </span>
            <Link href="/shop" className="underline font-semibold hover:no-underline">
              Browse
            </Link>
            <button
              onClick={handleDismiss}
              className="ml-auto p-1 rounded hover:bg-white/20 transition"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
