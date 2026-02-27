"use client";

import { Suspense } from "react";
import { ShopContent } from "./ShopContent";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse h-96" />}>
      <ShopContent />
    </Suspense>
  );
}
