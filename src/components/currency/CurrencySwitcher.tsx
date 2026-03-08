"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrencyStore, DISPLAY_CURRENCIES, type DisplayCurrency } from "@/store/currency-store";
import { cn } from "@/lib/utils";

const LABELS: Record<DisplayCurrency, string> = {
  GHS: "GHS",
  USD: "USD",
  NGN: "NGN",
  EUR: "EUR",
  GBP: "GBP",
};

export function CurrencySwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const fetchRates = useCurrencyStore((s) => s.fetchRates);
  const ratesError = useCurrencyStore((s) => s.ratesError);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-white/5 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select currency"
      >
        <span>{LABELS[currency]}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 min-w-[120px] py-1 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 z-50"
        >
          {DISPLAY_CURRENCIES.map((c) => (
            <li key={c} role="option" aria-selected={currency === c}>
              <button
                type="button"
                onClick={() => {
                  setCurrency(c);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                  currency === c
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
              >
                {LABELS[c]}
              </button>
            </li>
          ))}
          {ratesError && (
            <li className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 border-t border-neutral-100 dark:border-neutral-800">
              Rates unavailable
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
