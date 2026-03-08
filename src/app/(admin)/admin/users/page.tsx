"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, Pencil, Mail, User } from "lucide-react";
import type { UserRole } from "@/types";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  wallet_balance: number;
  created_at: string;
};

const roleColors: Record<UserRole, string> = {
  user: "bg-gray-100 text-gray-700",
  staff: "bg-blue-100 text-blue-800",
  admin: "bg-amber-100 text-amber-800",
  super_admin: "bg-purple-100 text-purple-800",
};

const ROLES: UserRole[] = ["user", "staff", "admin", "super_admin"];

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, phone, role, wallet_balance, created_at")
        .order("created_at", { ascending: false });
      setProfiles((data as ProfileRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (p.name?.toLowerCase().includes(q) ?? false) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone?.toLowerCase().includes(q) ?? false);
    const matchRole = roleFilter === "all" || p.role === roleFilter;
    return matchSearch && matchRole;
  });

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} user(s)</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-w-[160px]"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center text-gray-500 shadow-soft border border-gray-100 dark:border-gray-800">
          {profiles.length === 0 ? "No users yet." : "No users match your search."}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{p.name || "—"}</p>
                          {p.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{p.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                        <Mail className="w-4 h-4" />
                        {p.email}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${roleColors[p.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {p.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/20 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
