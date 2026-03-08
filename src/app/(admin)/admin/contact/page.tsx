"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

type Submission = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (dateFrom) {
      q = q.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      q = q.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      q = q.or(
        `name.ilike.${term},email.ilike.${term},subject.ilike.${term},message.ilike.${term}`
      );
    }

    const { data } = await q;
    setSubmissions((data as Submission[]) ?? []);
    setLoading(false);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

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
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
        Contact Submissions
      </h1>
      <p className="text-gray-500 mb-6">
        Messages sent through the contact form.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, subject, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
          title="To date"
        />
        {(search || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100">
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft"
            >
              <div className="flex flex-wrap justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <a href={`mailto:${s.email}`} className="text-sm text-primary-600 hover:underline">
                    {s.email}
                  </a>
                </div>
                <p className="text-sm text-gray-500">{formatDate(s.created_at)}</p>
              </div>
              {s.subject && (
                <p className="text-sm font-medium text-gray-700 mb-2">Subject: {s.subject}</p>
              )}
              <p className="text-gray-600 whitespace-pre-wrap">{s.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
