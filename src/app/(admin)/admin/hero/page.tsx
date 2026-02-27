"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { HeroSlide } from "@/types";

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSlides();
  }, []);

  async function loadSlides() {
    try {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });
      setSlides((data as HeroSlide[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slide?")) return;
    try {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
      toast.success("Slide deleted");
      loadSlides();
      if (editing?.id === id) setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleSave(data: Partial<HeroSlide>) {
    try {
      if (editing) {
        const { error } = await supabase
          .from("hero_slides")
          .update({
            image_url: data.image_url,
            title: data.title || null,
            subtitle: data.subtitle || null,
            link_url: data.link_url || null,
            sort_order: data.sort_order ?? editing.sort_order,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Slide updated");
      } else {
        const { error } = await supabase.from("hero_slides").insert({
          image_url: data.image_url!,
          title: data.title || null,
          subtitle: data.subtitle || null,
          link_url: data.link_url || null,
          sort_order: data.sort_order ?? slides.length,
        });
        if (error) throw error;
        toast.success("Slide added");
      }
      setEditing(null);
      setAdding(false);
      loadSlides();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Hero Slides
        </h1>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>

      <p className="text-gray-500 mb-6">
        These images appear in the homepage hero carousel. Slides auto-rotate every 5 seconds. Drag to reorder (update sort order).
      </p>

      {/* Add form */}
      {adding && (
        <SlideForm
          onSave={handleSave}
          onCancel={() => setAdding(false)}
          defaultSort={slides.length}
        />
      )}

      {/* Edit form */}
      {editing && !adding && (
        <SlideForm
          slide={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Slides list */}
      <div className="space-y-4">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="md:w-64 h-40 md:h-auto md:min-h-[140px] flex-shrink-0 relative bg-gray-100">
              <img
                src={slide.image_url}
                alt={slide.title ?? "Slide"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {slide.title || "Untitled"}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {slide.subtitle || "No subtitle"}
                </p>
                {slide.link_url && (
                  <p className="text-sm text-primary-600 mt-1">
                    Link: {slide.link_url}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Order: {slide.sort_order}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditing(slide);
                    setAdding(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100">
          <p>No hero slides yet.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
            Add your first slide
          </button>
        </div>
      )}
    </div>
  );
}

function SlideForm({
  slide,
  onSave,
  onCancel,
  defaultSort = 0,
}: {
  slide?: HeroSlide;
  onSave: (data: Partial<HeroSlide>) => void;
  onCancel: () => void;
  defaultSort?: number;
}) {
  const [imageUrl, setImageUrl] = useState(slide?.image_url ?? "");
  const [title, setTitle] = useState(slide?.title ?? "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? "");
  const [linkUrl, setLinkUrl] = useState(slide?.link_url ?? "");
  const [sortOrder, setSortOrder] = useState(slide?.sort_order ?? defaultSort);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!imageUrl.trim()) {
          toast.error("Image URL is required");
          return;
        }
        onSave({
          image_url: imageUrl.trim(),
          title: title.trim() || null,
          subtitle: subtitle.trim() || null,
          link_url: linkUrl.trim() || null,
          sort_order: sortOrder,
        });
      }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-6"
    >
      <h3 className="font-semibold text-gray-900 mb-4">
        {slide ? "Edit Slide" : "Add Slide"}
      </h3>
      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL *
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
            placeholder="https://..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Shop Premium Products"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtitle
          </label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="e.g. Perfumes, sneakers, electronics & more."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link URL (CTA destination)
          </label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
            placeholder="/shop or /shop?category=perfumes"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort order
          </label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            className="w-24 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="px-6 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
