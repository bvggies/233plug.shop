"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SitePage } from "@/types";

const SLUGS = ["about", "contact", "privacy", "terms"];

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    meta_description: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
  });

  useEffect(() => {
    if (!slug || !SLUGS.includes(slug)) {
      router.push("/admin/pages");
      return;
    }
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      const p = data as SitePage | null;
      setPage(p ?? null);
      if (p) {
        setForm({
          title: p.title,
          content: p.content ?? "",
          meta_description: p.meta_description ?? "",
          contact_email: p.contact_email ?? "",
          contact_phone: p.contact_phone ?? "",
          contact_address: p.contact_address ?? "",
        });
      } else {
        setForm({
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          content: "",
          meta_description: "",
          contact_email: "",
          contact_phone: "",
          contact_address: "",
        });
      }
      setLoading(false);
    }
    load();
  }, [slug, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        content: form.content || null,
        meta_description: form.meta_description || null,
      };
      if (slug === "contact") {
        payload.contact_email = form.contact_email || null;
        payload.contact_phone = form.contact_phone || null;
        payload.contact_address = form.contact_address || null;
      }

      if (page) {
        const { error } = await createClient()
          .from("site_pages")
          .update(payload)
          .eq("id", page.id);
        if (error) throw error;
        toast.success("Page updated");
      } else {
        const { error } = await createClient()
          .from("site_pages")
          .insert({ slug, ...payload });
        if (error) throw error;
        toast.success("Page created");
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const label = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "";

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Pages
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit {label}
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 max-w-3xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta description
            </label>
            <input
              type="text"
              value={form.meta_description}
              onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <p className="text-xs text-gray-500 mb-2">
              Use ## for headings, - for lists, **bold**
            </p>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-y"
            />
          </div>
          {slug === "contact" && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900">Contact info</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={form.contact_address}
                  onChange={(e) => setForm((f) => ({ ...f, contact_address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <Link
            href={slug ? `/${slug}` : "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            View page
          </Link>
        </div>
      </form>
    </div>
  );
}
