"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pencil } from "lucide-react";
import type { SitePage } from "@/types";

const SLUGS = ["about", "contact", "privacy", "terms"] as const;

export default function AdminPagesPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .in("slug", SLUGS);
      setPages((data as SitePage[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const getPageBySlug = (slug: string) => pages.find((p) => p.slug === slug);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
        Site Pages
      </h1>
      <p className="text-gray-500 mb-6">
        Edit content for About, Contact, Privacy, and Terms pages.
      </p>

      <div className="grid gap-4">
        {SLUGS.map((slug) => {
          const page = getPageBySlug(slug);
          const label = slug.charAt(0).toUpperCase() + slug.slice(1);
          return (
            <div
              key={slug}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-soft"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {page?.title ?? "No content yet"}
                </p>
              </div>
              <Link
                href={`/admin/pages/${slug}`}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-xl transition"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
