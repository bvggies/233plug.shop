"use client";

import Link from "next/link";
import Image from "next/image";
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

const sizeMap = {
  sm: { class: "h-7", width: 28, height: 28 },
  md: { class: "h-9", width: 36, height: 36 },
  lg: { class: "h-11", width: 44, height: 44 },
};

export function Logo({
  variant = "light",
  size = "md",
  className,
  href = "/",
  asLink = true,
}: LogoProps) {
  const { class: heightClass, width, height } = sizeMap[size];

  const content = (
    <span
      className={cn("inline-flex items-center shrink-0", heightClass, className)}
      aria-label="233Plug"
    >
      <Image
        src="/logo.png"
        alt="233Plug"
        width={width}
        height={height}
        className="object-contain w-auto h-full"
        priority
        unoptimized={false}
      />
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
