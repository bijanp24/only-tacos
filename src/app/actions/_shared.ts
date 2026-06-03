import { redirect } from "next/navigation";

export function slugifyUsername(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export function errRedirect(path: string, msg: string): never {
  redirect(`${path}?error=${encodeURIComponent(msg)}`);
}
