"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/store/currency-store";
import { formatPrice } from "@/lib/utils";

const DEFAULT_STORE_CURRENCY = "GHS";

/**
 * Converts amount from store currency (e.g. GHS) to the user's selected display currency
 * and returns a formatted string. Uses real-time rates from ExchangeRate.host.
 * If rates aren't loaded or same currency, shows amount in original currency.
 */
export function useDisplayPrice(amount: number, fromCurrency: string = DEFAULT_STORE_CURRENCY): string {
  const currency = useCurrencyStore((s) => s.currency);
  const convert = useCurrencyStore((s) => s.convert);
  const isReady = useCurrencyStore((s) => s.isReady);
  const fetchRates = useCurrencyStore((s) => s.fetchRates);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  if (fromCurrency === currency || !isReady()) {
    return formatPrice(amount, fromCurrency);
  }
  const converted = convert(amount, fromCurrency, currency);
  return formatPrice(converted, currency);
}

/**
 * Renders a price with conversion. Use in JSX (e.g. inside map).
 */
export function DisplayPrice({
  amount,
  currency = DEFAULT_STORE_CURRENCY,
}: {
  amount: number;
  currency?: string;
}) {
  const text = useDisplayPrice(amount, currency);
  return <>{text}</>;
}

/**
 * Returns the numeric value in display currency (for calculations or custom formatting).
 */
export function useConvertedAmount(amount: number, fromCurrency: string = DEFAULT_STORE_CURRENCY): number {
  const currency = useCurrencyStore((s) => s.currency);
  const convert = useCurrencyStore((s) => s.convert);
  const isReady = useCurrencyStore((s) => s.isReady);
  if (fromCurrency === currency || !isReady()) return amount;
  return convert(amount, fromCurrency, currency);
}
