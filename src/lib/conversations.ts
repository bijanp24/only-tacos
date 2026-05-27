import { db } from "./db";

export function canonicalPair(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export async function findOrCreateConversation(meId: string, otherId: string) {
  if (meId === otherId) throw new Error("Cannot start a conversation with yourself.");
  const pair = canonicalPair(meId, otherId);
  return db.conversation.upsert({
    where: { userAId_userBId: pair },
    create: pair,
    update: {},
  });
}
