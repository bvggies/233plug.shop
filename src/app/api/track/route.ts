import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_tracking_info", { code: code.toUpperCase() });
  if (error) {
    console.error("[track]", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (data == null) {
    return NextResponse.json({ error: "Not found", data: null }, { status: 404 });
  }
  return NextResponse.json(data);
}
