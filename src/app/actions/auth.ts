"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { errRedirect, slugifyUsername } from "./_shared";

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
