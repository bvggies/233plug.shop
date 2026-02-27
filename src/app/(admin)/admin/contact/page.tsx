"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      setSubmissions((data as Submission[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

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
