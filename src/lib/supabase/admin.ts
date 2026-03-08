import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client with service role key. Bypasses RLS.
 * Use only in server-side code (e.g. API routes, webhooks) when you need to
 * act as the backend, not as a user (e.g. updating order status after payment webhook).
 */
export function createAdminClient() {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient(url, serviceRoleKey);
}
