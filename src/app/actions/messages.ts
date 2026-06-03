"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findOrCreateConversation } from "@/lib/conversations";

export async function sendMessage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const recipientId = String(formData.get("recipientId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!recipientId || !body || recipientId === user.id) return;
  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (!recipient) return;

  const conversation = await findOrCreateConversation(user.id, recipientId);
  await db.message.create({
    data: { conversationId: conversation.id, senderId: user.id, body },
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversation.id}`);
  redirect(`/inbox/${conversation.id}`);
}
