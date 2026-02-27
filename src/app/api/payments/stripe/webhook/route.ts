import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Missing config" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const supabase = await createClient();
      const { data: order } = await supabase.from("orders").select("user_id, coupon_id").eq("id", orderId).single();
      if (order) {
        await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
        await supabase.from("payments").insert({
          user_id: order.user_id,
          order_id: orderId,
          amount: (session.amount_total ?? 0) / 100,
          currency: (session.currency ?? "usd").toUpperCase(),
          payment_method: "stripe",
          status: "completed",
          transaction_id: session.id,
        });
        if (order.coupon_id) {
          const { data: c } = await supabase.from("coupons").select("used_count").eq("id", order.coupon_id).single();
          if (c) await supabase.from("coupons").update({ used_count: (c.used_count ?? 0) + 1 }).eq("id", order.coupon_id);
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
