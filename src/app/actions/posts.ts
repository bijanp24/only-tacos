"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { errRedirect } from "./_shared";

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
