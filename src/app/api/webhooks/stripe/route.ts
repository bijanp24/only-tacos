import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe, CHECKOUT_KIND } from "@/lib/payments/stripe";

// Stripe signature verification needs the raw, unparsed request body, so this
// handler must read req.text() and never req.json().
export const runtime = "nodejs";

const SUBSCRIPTION_DAYS = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await fulfillCheckout(session);
    } catch (err) {
      console.error("Failed to fulfill checkout session", session.id, err);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const kind = metadata.kind;

  if (kind === CHECKOUT_KIND.subscription) {
    const { subscriberId, creatorId } = metadata;
    if (!subscriberId || !creatorId) {
      throw new Error("Subscription metadata missing subscriberId/creatorId");
    }
    const stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);
    const expiresAt = new Date(
      Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000,
    );
    await db.subscription.upsert({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
      create: {
        subscriberId,
        creatorId,
        expiresAt,
        status: "active",
        stripeSubscriptionId,
      },
      update: { expiresAt, status: "active", stripeSubscriptionId },
    });
    return;
  }

  if (kind === CHECKOUT_KIND.tip) {
    const { fromId, toId, amount, message } = metadata;
    if (!fromId || !toId || !amount) {
      throw new Error("Tip metadata missing fromId/toId/amount");
    }
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    // Guard against duplicate webhook deliveries writing the tip twice.
    if (paymentIntentId) {
      const existing = await db.tip.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true },
      });
      if (existing) return;
    }

    await db.tip.create({
      data: {
        fromId,
        toId,
        amount: Number(amount),
        message: message ?? "",
        stripePaymentIntentId: paymentIntentId,
      },
    });
  }
}
