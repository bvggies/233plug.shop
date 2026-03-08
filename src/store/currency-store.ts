"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DISPLAY_CURRENCIES = ["GHS", "USD", "NGN", "EUR", "GBP"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const DEFAULT_CURRENCY: DisplayCurrency = "GHS";
const RATES_STALE_MS = 60 * 60 * 1000; // 1 hour

interface CurrencyState {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  quotes: Record<string, number>;
  ratesFetchedAt: number | null;
  ratesError: string | null;
  fetchRates: () => Promise<void>;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
  isReady: () => boolean;
}

function convertWithQuotes(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  quotes: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const source = "USD";
  const fromKey = source + fromCurrency;
  const toKey = source + toCurrency;
  const rateFrom = fromCurrency === source ? 1 : quotes[fromKey];
  const rateTo = toCurrency === source ? 1 : quotes[toKey];
  if (rateFrom == null || rateTo == null) return amount;
  const amountInSource = amount / rateFrom;
  return amountInSource * rateTo;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: DEFAULT_CURRENCY,
      quotes: {},
      ratesFetchedAt: null,
      ratesError: null,

      setCurrency: (c) => set({ currency: c }),

      fetchRates: async () => {
        const { ratesFetchedAt } = get();
        if (ratesFetchedAt != null && Date.now() - ratesFetchedAt < RATES_STALE_MS) {
          return;
        }
        set({ ratesError: null });
        try {
          const res = await fetch("/api/rates");
          const data = await res.json();
          if (!res.ok || !data.success) {
            set({ ratesError: data?.error ?? "Failed to load rates" });
            return;
          }
          set({
            quotes: data.quotes ?? {},
            ratesFetchedAt: Date.now(),
            ratesError: null,
          });
        } catch {
          set({ ratesError: "Network error" });
        }
      },

      convert: (amount, fromCurrency, toCurrency) => {
        const { quotes } = get();
        return convertWithQuotes(amount, fromCurrency, toCurrency, quotes);
      },

      isReady: () => {
        const { currency, quotes } = get();
        if (currency === "GHS") return true;
        if (currency === "USD") return true; // source currency, no rate needed
        const usdGhs = quotes["USDGHS"];
        const targetKey = "USD" + currency;
        const targetRate = quotes[targetKey];
        return usdGhs != null && targetRate != null;
      },
    }),
    { name: "233plug-currency", partialize: (s) => ({ currency: s.currency }) }
  )
);
