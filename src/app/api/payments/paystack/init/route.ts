import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId } = await req.json();
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack not configured" },
        { status: 500 }
      );
    }
    const origin = req.headers.get("origin");
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      origin ||
      (forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : null) ||
      "http://localhost:3000";
    const callbackUrl = `${baseUrl.replace(/\/$/, "")}/checkout/callback?order=${orderId}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount),
        currency: "GHS",
        metadata: { orderId },
        callback_url: callbackUrl,
      }),
    });
    const data = await res.json();
    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Paystack error" },
        { status: 400 }
      );
    }
    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
