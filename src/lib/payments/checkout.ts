import { db } from "@/lib/db";
import { getStripe, baseUrl, CHECKOUT_KIND } from "./stripe";

interface Payer {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}

interface Creator {
  id: string;
  username: string;
  displayName: string;
  monthlyPrice: number;
}

// Reuse the payer's Stripe Customer across checkouts; create + persist on first use.
async function getOrCreateCustomer(payer: Payer): Promise<string> {
  if (payer.stripeCustomerId) return payer.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: payer.email,
    metadata: { userId: payer.id },
  });
  await db.user.update({
    where: { id: payer.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

// Creates a `subscription`-mode Checkout Session priced from the creator's
// monthlyPrice. The Subscription DB row is written later, by the webhook.
export async function createSubscriptionCheckout(
  subscriber: Payer,
  creator: Creator,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(subscriber);
  const metadata = {
    kind: CHECKOUT_KIND.subscription,
    subscriberId: subscriber.id,
    creatorId: creator.id,
  };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: creator.monthlyPrice,
          recurring: { interval: "month" },
          product_data: {
            name: `Monthly subscription to ${creator.displayName} (@${creator.username})`,
          },
        },
      },
    ],
    metadata,
    subscription_data: { metadata },
    success_url: `${baseUrl()}/${creator.username}?checkout=success`,
    cancel_url: `${baseUrl()}/${creator.username}?checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

// Creates a one-time `payment`-mode Checkout Session for a tip. The Tip DB row
// is written later, by the webhook.
export async function createTipCheckout(
  payer: Payer,
  creator: Creator,
  amount: number,
  message: string,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(payer);
  const metadata = {
    kind: CHECKOUT_KIND.tip,
    fromId: payer.id,
    toId: creator.id,
    amount: String(amount),
    message,
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: `Tip to ${creator.displayName} (@${creator.username})`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${baseUrl()}/${creator.username}?tip=success`,
    cancel_url: `${baseUrl()}/${creator.username}?tip=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}
