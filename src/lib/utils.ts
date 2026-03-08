import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

export function formatPrice(amount: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/** Effective price after product discount (percent or fixed off). */
export function getProductEffectivePrice(
  price: number,
  discountType: "percent" | "fixed" | null | undefined,
  discountValue: number | null | undefined
): number {
  if (!discountType || discountValue == null || discountValue <= 0) return price;
  if (discountType === "percent") {
    return Math.max(0, price * (1 - discountValue / 100));
  }
  return Math.max(0, price - discountValue);
}
