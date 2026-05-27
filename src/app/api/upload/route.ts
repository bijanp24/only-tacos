import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const store = getStore("uploads");
  await store.set(filename, Buffer.from(await file.arrayBuffer()), {
    metadata: { contentType: file.type },
  });

  return NextResponse.json({ url: `/api/files/${filename}` });
}
