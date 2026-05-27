import { db } from "./db";

export async function isSubscribed(subscriberId: string, creatorId: string) {
  if (subscriberId === creatorId) return true;
  const sub = await db.subscription.findUnique({
    where: { subscriberId_creatorId: { subscriberId, creatorId } },
  });
  return !!sub && sub.expiresAt > new Date();
}
