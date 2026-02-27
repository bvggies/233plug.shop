import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !sig) {
    return NextResponse.json({ status: "failed" }, { status: 400 });
  }
  const crypto = await import("crypto");
  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");
  if (hash !== sig) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  const event = JSON.parse(body);
  if (event.event === "charge.success") {
    const { orderId } = event.data.metadata || {};
    if (orderId) {
      const supabase = await createClient();
      const { data: order } = await supabase.from("orders").select("user_id, coupon_id").eq("id", orderId).single();
      if (order) {
        await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
        if (order.coupon_id) {
          const { data: c } = await supabase.from("coupons").select("used_count").eq("id", order.coupon_id).single();
          if (c) await supabase.from("coupons").update({ used_count: (c.used_count ?? 0) + 1 }).eq("id", order.coupon_id);
        }
        await supabase.from("payments").insert({
          user_id: order.user_id,
          order_id: orderId,
          amount: event.data.amount / 100,
          currency: "GHS",
          payment_method: "paystack",
          status: "completed",
          transaction_id: event.data.reference,
        });
      }
    }
  }
  return NextResponse.json({ status: "ok" });
}
