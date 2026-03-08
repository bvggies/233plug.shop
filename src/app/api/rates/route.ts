import { NextResponse } from "next/server";

const CACHE_MAX_AGE_SECONDS = 3600; // 1 hour to stay within free tier (100 req/month)
const EXCHANGERATE_API = "https://api.exchangerate.host/live";

export const dynamic = "force-dynamic";
export const revalidate = CACHE_MAX_AGE_SECONDS;

export async function GET() {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Exchange rate API not configured" },
      { status: 503 }
    );
  }
  try {
    const url = `${EXCHANGERATE_API}?access_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      next: { revalidate: CACHE_MAX_AGE_SECONDS },
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.message ?? "Exchange rate fetch failed" },
        { status: res.status }
      );
    }
    if (data?.success === false && data?.error) {
      return NextResponse.json(
        { success: false, error: data.error.info ?? data.error.code },
        { status: 502 }
      );
    }
    return NextResponse.json({
      success: true,
      source: data.source ?? "USD",
      quotes: data.quotes ?? {},
      timestamp: data.timestamp,
    });
  } catch (err) {
    console.error("[rates]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rates" },
      { status: 500 }
    );
  }
}
