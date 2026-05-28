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
    <form action={createPost} className="space-y-4">
      <input
        name="title"
        placeholder="Post title"
        required
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
      />
      <textarea
        name="body"
        placeholder="Tell the world about today's taco…"
        required
        rows={4}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
      />

      {/* Image upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--foreground)]">
          Image <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <label className={`flex items-center gap-2 w-fit cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3.5 py-2 text-sm font-medium hover:border-orange-300 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          {uploading ? "Uploading…" : "Choose image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onFile}
            disabled={uploading}
            className="sr-only"
          />
        </label>
        {uploadError && (
          <p className="text-xs text-red-600">{uploadError}</p>
        )}
        {imageUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-20 rounded-lg object-cover border border-[var(--border)]"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs text-[var(--text-muted)] hover:text-red-600 transition-colors underline"
            >
              Remove
            </button>
          </div>
        )}
        <input type="hidden" name="imageUrl" value={imageUrl} />
      </div>

      <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
        <input type="checkbox" name="isLocked" className="h-4 w-4 rounded accent-orange-600" />
        <span className="group-hover:text-orange-600 transition-colors">
          Subscribers only <span className="text-[var(--text-muted)]">(paywalled)</span>
        </span>
      </label>

      <button
        disabled={uploading}
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        Publish post
      </button>
    </form>
  );
}
