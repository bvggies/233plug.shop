"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { FAQ } from "@/types";

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await createClient().from("faqs").select("*").order("sort_order", { ascending: true });
    setFaqs((data as FAQ[]) ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const { error } = await createClient().from("faqs").delete().eq("id", id);
      if (error) throw error;
      toast.success("FAQ deleted");
      load();
      if (editing?.id === id) setEditing(null);
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleSave(data: { question: string; answer: string; sort_order: number }) {
    try {
      if (editing) {
        const { error } = await createClient().from("faqs").update(data).eq("id", editing.id);
        if (error) throw error;
        toast.success("FAQ updated");
      } else {
        const { error } = await createClient().from("faqs").insert(data);
        if (error) throw error;
        toast.success("FAQ added");
      }
      setEditing(null);
      setAdding(false);
      load();
    } catch {
      toast.error("Failed to save");
    }
  }

  if (loading) return <div><Skeleton className="h-48 rounded-2xl" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">FAQs</h1>
          <p className="text-gray-500 text-sm">Manage frequently asked questions</p>
        </div>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {(adding || editing) && (
        <FAQForm
          faq={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => { setAdding(false); setEditing(null); }}
          defaultOrder={faqs.length}
        />
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex items-start justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-soft">
            <div>
              <p className="font-semibold text-gray-900">{faq.question}</p>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{faq.answer}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(faq); setAdding(false); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {faqs.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100">
          <p>No FAQs yet. Add your first one.</p>
        </div>
      )}
    </div>
  );
}

function FAQForm({ faq, onSave, onCancel, defaultOrder }: {
  faq?: FAQ;
  onSave: (d: { question: string; answer: string; sort_order: number }) => void;
  onCancel: () => void;
  defaultOrder: number;
}) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [sortOrder, setSortOrder] = useState(faq?.sort_order ?? defaultOrder);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!question.trim()) return toast.error("Question required"); if (!answer.trim()) return toast.error("Answer required"); onSave({ question: question.trim(), answer: answer.trim(), sort_order: sortOrder }); }} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">{faq ? "Edit FAQ" : "Add FAQ"}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 resize-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort order</label>
          <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} className="w-24 px-4 py-2 rounded-xl border border-gray-200" />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600">Save</button>
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-200 rounded-xl">Cancel</button>
      </div>
    </form>
  );
}
