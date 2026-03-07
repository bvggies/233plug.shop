"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "light" | "dark";

interface LogoProps {
  /** light = dark green on light bg (header), dark = white on dark bg (footer) */
  variant?: LogoVariant;
  /** sm = compact, md = default, lg = larger */
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  /** If true, render as link to home; otherwise span */
  asLink?: boolean;
}

const sizeClasses = {
  sm: "h-7",
  md: "h-9",
  lg: "h-11",
};

export function Logo({
  variant = "light",
  size = "md",
  className,
  href = "/",
  asLink = true,
}: LogoProps) {
  const isDark = variant === "dark";
  const heightClass = sizeClasses[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display font-bold tracking-tight",
        heightClass,
        isDark ? "text-white" : "text-primary-600 dark:text-primary-400",
        className
      )}
      aria-label="233Plug"
    >
      <span
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0 rounded-lg font-bold text-white",
          size === "sm" && "w-7 h-7 text-xs",
          size === "md" && "w-9 h-9 text-sm",
          size === "lg" && "w-10 h-10 text-base",
          isDark ? "bg-white/20" : "bg-primary-500"
        )}
      >
        23
      </span>
      <span>Plug</span>
    </span>
  );

  if (asLink) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
        {content}
      </Link>
    );
  }
  return content;
}
