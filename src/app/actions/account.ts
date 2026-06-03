"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
