import Stripe from "stripe";

// Lazily-constructed singleton so a missing key only errors when payments are
// actually used, not at import time (keeps build/lint green without secrets).
let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  client = new Stripe(key);
  return client;
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

// Metadata keys carried on the Checkout Session so the webhook can write the
// correct DB row after Stripe confirms payment. No row is written before then.
export const CHECKOUT_KIND = {
  subscription: "subscription",
  tip: "tip",
} as const;

export type CheckoutKind = (typeof CHECKOUT_KIND)[keyof typeof CHECKOUT_KIND];
