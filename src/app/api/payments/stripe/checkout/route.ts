import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
  const { orderId, amount, items } = body;
    const stripe = await import("stripe");
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }
    const s = new stripe.default(stripeSecret);
    const lineItems = (amount !== undefined && amount !== null)
      ? [{ price_data: { currency: "usd", product_data: { name: "Order Total" }, unit_amount: Math.round((amount as number) * 100) }, quantity: 1 }]
      : (items || []).map(
        (i: { product?: { name: string }; price: number; quantity: number }) => ({
          price_data: {
            currency: "usd",
            product_data: { name: i.product?.name || "Product" },
            unit_amount: Math.round((i.price || 0) * 100),
          },
          quantity: i.quantity,
        })
      );
    const session = await s.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout`,
      metadata: { orderId },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
