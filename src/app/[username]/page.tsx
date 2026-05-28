import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscriptions";
import { canonicalPair } from "@/lib/conversations";
import { subscribe, unsubscribe, sendTip, sendMessage } from "../actions";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await db.user.findUnique({
    where: { username },
    include: {
      posts: { orderBy: { createdAt: "desc" } },
      _count: { select: { subscribers: true, posts: true } },
    },
  });
  if (!creator) notFound();

  const viewer = await getCurrentUser();
  const subscribed = viewer ? await isSubscribed(viewer.id, creator.id) : false;
  const isSelf = viewer?.id === creator.id;
  const existingConvo =
    viewer && !isSelf
      ? await db.conversation.findUnique({
          where: { userAId_userBId: canonicalPair(viewer.id, creator.id) },
          select: { id: true },
        })
      : null;

  return (
    <div className="space-y-8">
      {/* ── Profile header ── */}
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-4xl shadow-sm">
            🌮
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{creator.displayName}</h1>
                <p className="text-sm text-[var(--text-muted)]">@{creator.username}</p>
              </div>
              {creator.isCreator && !isSelf && (
                <SubscribeControl
                  creatorId={creator.id}
                  price={creator.monthlyPrice}
                  subscribed={subscribed}
                  signedIn={!!viewer}
                />
              )}
            </div>

            {creator.bio && (
              <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{creator.bio}</p>
            )}

            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-[var(--text-muted)]">
                <strong className="text-[var(--foreground)]">{creator._count.posts}</strong> posts
              </span>
              <span className="text-[var(--text-muted)]">
                <strong className="text-[var(--foreground)]">{creator._count.subscribers}</strong> subscribers
              </span>
              {creator.isCreator && (
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                  ${(creator.monthlyPrice / 100).toFixed(2)}/mo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tip + message row */}
        {viewer && !isSelf && creator.isCreator && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 border-t border-[var(--border-subtle)] pt-5">
            <TipForm creatorId={creator.id} />
            <MessageLink
              recipientId={creator.id}
              existingConvoId={existingConvo?.id}
            />
          </div>
        )}
      </header>

      {/* ── Posts ── */}
      <section>
        <h2 className="text-xl font-bold mb-5">Posts</h2>
        {creator.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-12 text-center text-[var(--text-muted)] text-sm">
            No posts yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {creator.posts.map((post) => {
              const canSee = !post.isLocked || subscribed || isSelf;
              return (
                <li
                  key={post.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold">{post.title}</h3>
                    <span className="shrink-0 text-xs text-[var(--text-subtle)]">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {post.isLocked && (
                    <span className="inline-block mb-3 text-xs rounded-full bg-orange-50 px-2.5 py-0.5 font-medium text-orange-700 ring-1 ring-orange-200">
                      🔒 Subscribers only
                    </span>
                  )}
                  {canSee ? (
                    <>
                      {post.imageUrl && (
                        <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">
                          <Image
                            src={post.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--foreground)] leading-relaxed">
                        {post.body}
                      </p>
                    </>
                  ) : (
                    <LockedPostTeaser
                      creatorId={creator.id}
                      price={creator.monthlyPrice}
                      signedIn={!!viewer}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SubscribeControl({
  creatorId,
  price,
  subscribed,
  signedIn,
}: {
  creatorId: string;
  price: number;
  subscribed: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href="/sign-in"
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all"
      >
        Sign in to subscribe
      </Link>
    );
  }
  if (subscribed) {
    return (
      <form action={unsubscribe}>
        <input type="hidden" name="creatorId" value={creatorId} />
        <button className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-sm font-medium hover:border-red-300 hover:text-red-600 transition-colors">
          Subscribed · Cancel
        </button>
      </form>
    );
  }
  return (
    <form action={subscribe}>
      <input type="hidden" name="creatorId" value={creatorId} />
      <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all">
        Subscribe · ${(price / 100).toFixed(2)}/mo
      </button>
    </form>
  );
}

function TipForm({ creatorId }: { creatorId: string }) {
  return (
    <form action={sendTip} className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4">
      <div className="text-sm font-semibold mb-3">Send a tip 🌮</div>
      <input type="hidden" name="creatorId" value={creatorId} />
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          min={100}
          max={50000}
          defaultValue={200}
          required
          className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
        <input
          name="message"
          placeholder="Optional note"
          maxLength={280}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
        <button className="rounded-lg bg-orange-600 px-3 py-1.5 text-white text-sm font-semibold hover:bg-orange-700 active:scale-[0.98] transition-all">
          Tip
        </button>
      </div>
      <p className="mt-2 text-[10px] text-[var(--text-subtle)]">amount in cents · 200 = $2.00</p>
    </form>
  );
}

function MessageLink({
  recipientId,
  existingConvoId,
}: {
  recipientId: string;
  existingConvoId?: string;
}) {
  if (existingConvoId) {
    return (
      <Link
        href={`/inbox/${existingConvoId}`}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 hover:border-orange-300 transition-colors flex flex-col justify-center"
      >
        <span className="text-sm font-semibold">Continue conversation →</span>
        <span className="text-xs text-[var(--text-muted)] mt-0.5">Open the message thread</span>
      </Link>
    );
  }
  return (
    <form action={sendMessage} className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4">
      <div className="text-sm font-semibold mb-3">Send a message</div>
      <input type="hidden" name="recipientId" value={recipientId} />
      <div className="flex gap-2">
        <input
          name="body"
          placeholder="Say hi…"
          required
          maxLength={2000}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
        <button className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all">
          Send
        </button>
      </div>
    </form>
  );
}

function LockedPostTeaser({
  creatorId,
  price,
  signedIn,
}: {
  creatorId: string;
  price: number;
  signedIn: boolean;
}) {
  return (
    <div className="mt-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-8 text-center">
      <div className="text-3xl mb-2">🔒</div>
      <p className="text-sm text-[var(--foreground)] mb-4">
        Subscribe to unlock this post.
      </p>
      {signedIn ? (
        <form action={subscribe}>
          <input type="hidden" name="creatorId" value={creatorId} />
          <button className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all">
            Subscribe · ${(price / 100).toFixed(2)}/mo
          </button>
        </form>
      ) : (
        <Link
          href="/sign-in"
          className="inline-block rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all"
        >
          Sign in to subscribe
        </Link>
      )}
    </div>
  );
}
