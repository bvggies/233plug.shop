import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const adminPaths = ["/admin"];
const dashboardPaths = ["/dashboard"];
const protectedPaths = ["/checkout"];

function isAdminPath(pathname: string) {
  return adminPaths.some((p) => pathname.startsWith(p));
}
function isDashboardPath(pathname: string) {
  return dashboardPaths.some((p) => pathname.startsWith(p));
}
function isProtectedPath(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request);

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
