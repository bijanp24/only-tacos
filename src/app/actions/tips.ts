"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createTipCheckout } from "@/lib/payments/checkout";

export async function sendTip(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const creatorId = String(formData.get("creatorId") ?? "");
  const amount = Math.max(100, Math.min(50000, Number(formData.get("amount") ?? 0) | 0));
  const message = String(formData.get("message") ?? "").trim().slice(0, 280);
  if (!creatorId || creatorId === user.id || !amount) return;
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator) return;

  // No DB row here: hand off to Stripe Checkout. The Tip is written by the
  // webhook only after the one-time payment is confirmed.
  const checkoutUrl = await createTipCheckout(user, creator, amount, message);
  redirect(checkoutUrl);
}
