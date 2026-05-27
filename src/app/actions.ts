"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { findOrCreateConversation } from "@/lib/conversations";

function slugifyUsername(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function errRedirect(path: string, msg: string): never {
  redirect(`${path}?error=${encodeURIComponent(msg)}`);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = slugifyUsername(String(formData.get("username") ?? ""));
  const isCreator = formData.get("isCreator") === "on";

  if (!email || !password || password.length < 6 || !displayName || !username) {
    errRedirect("/sign-up", "All fields required. Password must be 6+ characters.");
  }
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) errRedirect("/sign-up", "Email or username already taken.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { email, username, displayName, passwordHash, isCreator },
  });
  await createSession(user.id);
  redirect(isCreator ? "/dashboard" : "/");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    errRedirect("/sign-in", "Invalid email or password.");
  }
  await createSession(user.id);
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isCreator) errRedirect("/dashboard", "Only creators can post.");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const isLocked = formData.get("isLocked") === "on";
  if (!title || !body) errRedirect("/dashboard", "Title and body required.");

  await db.post.create({
    data: { authorId: user.id, title, body, imageUrl, isLocked },
  });
  revalidatePath("/");
  revalidatePath(`/${user.username}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

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

export async function sendTip(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const creatorId = String(formData.get("creatorId") ?? "");
  const amount = Math.max(100, Math.min(50000, Number(formData.get("amount") ?? 0) | 0));
  const message = String(formData.get("message") ?? "").trim().slice(0, 280);
  if (!creatorId || creatorId === user.id || !amount) return;
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator) return;
  await db.tip.create({
    data: { fromId: user.id, toId: creatorId, amount, message },
  });
  revalidatePath(`/${creator.username}`);
  revalidatePath("/dashboard");
}

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

export async function becomeCreator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const monthlyPrice = Math.max(
    100,
    Math.min(10000, Number(formData.get("monthlyPrice") ?? 500) | 0)
  );
  const bio = String(formData.get("bio") ?? "").trim();
  await db.user.update({
    where: { id: user.id },
    data: { isCreator: true, monthlyPrice, bio },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);
  redirect("/dashboard");
}
