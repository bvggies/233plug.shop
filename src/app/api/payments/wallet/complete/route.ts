import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * After the client has deducted wallet balance and inserted a wallet_transaction,
 * call this to mark the order paid, insert the payment record, and increment coupon used_count.
 * Uses service role so coupon update is allowed.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, status, coupon_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    const { data: orderForAmount } = await admin
      .from("orders")
      .select("total_price, currency")
      .eq("id", orderId)
      .single();

    const amount = orderForAmount?.total_price ?? 0;
    const currency = orderForAmount?.currency ?? "GHS";

    await admin.from("orders").update({ status: "paid" }).eq("id", orderId);

    await admin.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: Number(amount),
      currency,
      payment_method: "wallet",
      status: "completed",
    });

    if (order.coupon_id) {
      const { data: c } = await admin.from("coupons").select("used_count").eq("id", order.coupon_id).single();
      if (c) {
        await admin.from("coupons").update({ used_count: (c.used_count ?? 0) + 1 }).eq("id", order.coupon_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Wallet complete failed" },
      { status: 500 }
    );
  }
}
