"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function subscribe(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const creatorId = String(formData.get("creatorId") ?? "");
  if (!creatorId || creatorId === user.id) return;
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator) return;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.subscription.upsert({
    where: { subscriberId_creatorId: { subscriberId: user.id, creatorId } },
    create: { subscriberId: user.id, creatorId, expiresAt },
    update: { expiresAt },
  });
  revalidatePath(`/${creator.username}`);
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
