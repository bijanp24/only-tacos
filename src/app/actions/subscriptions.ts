"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/payments/checkout";

export async function subscribe(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const creatorId = String(formData.get("creatorId") ?? "");
  if (!creatorId || creatorId === user.id) return;
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator) return;

  // No DB row here: hand off to Stripe Checkout. The Subscription is written by
  // the webhook only after payment is confirmed.
  const checkoutUrl = await createSubscriptionCheckout(user, creator);
  redirect(checkoutUrl);
}

export async function unsubscribe(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const creatorId = String(formData.get("creatorId") ?? "");
  await db.subscription.deleteMany({
    where: { subscriberId: user.id, creatorId },
  });
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (creator) revalidatePath(`/${creator.username}`);
}
