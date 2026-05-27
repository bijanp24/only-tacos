"use client";

import { useState } from "react";
import { createPost } from "../actions";

export default function PostComposer() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={createPost} className="space-y-3">
      <input
        name="title"
        placeholder="Post title"
        required
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <textarea
        name="body"
        placeholder="Tell the world about today's taco..."
        required
        rows={5}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <div className="space-y-2">
        <label className="block text-sm font-medium">Image (optional)</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onFile}
          disabled={uploading}
          className="block text-sm"
        />
        {uploading && (
          <p className="text-xs text-neutral-500">Uploading…</p>
        )}
        {uploadError && (
          <p className="text-xs text-red-600">{uploadError}</p>
        )}
        {imageUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-20 rounded object-cover border"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs text-neutral-500 underline"
            >
              Remove
            </button>
          </div>
        )}
        <input type="hidden" name="imageUrl" value={imageUrl} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isLocked" />
        Subscribers only (paywalled)
      </label>
      <button
        disabled={uploading}
        className="rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700 disabled:opacity-50"
      >
        Publish
      </button>
    </form>
  );
}
