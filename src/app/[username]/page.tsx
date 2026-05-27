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
      <header className="rounded-xl bg-white border border-neutral-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
            🌮
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{creator.displayName}</h1>
            <p className="text-neutral-500">@{creator.username}</p>
            {creator.bio && (
              <p className="mt-2 text-neutral-700">{creator.bio}</p>
            )}
            <div className="mt-3 flex gap-4 text-sm text-neutral-600">
              <span>{creator._count.posts} posts</span>
              <span>{creator._count.subscribers} subscribers</span>
            </div>
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
        {viewer && !isSelf && creator.isCreator && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 border-t border-neutral-100 pt-6">
            <TipForm creatorId={creator.id} />
            <MessageLink
              recipientId={creator.id}
              existingConvoId={existingConvo?.id}
            />
          </div>
        )}
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {creator.posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <ul className="space-y-4">
            {creator.posts.map((post) => {
              const canSee = !post.isLocked || subscribed || isSelf;
              return (
                <li
                  key={post.id}
                  className="rounded-lg border border-neutral-200 bg-white p-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <span className="text-xs text-neutral-500">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {canSee ? (
                    <>
                      {post.imageUrl && (
                        <div className="mt-3 relative w-full aspect-video rounded overflow-hidden bg-neutral-100">
                          <Image
                            src={post.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className="mt-3 whitespace-pre-wrap text-neutral-800">
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
        className="rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700"
      >
        Sign in to subscribe
      </Link>
    );
  }
  if (subscribed) {
    return (
      <form action={unsubscribe}>
        <input type="hidden" name="creatorId" value={creatorId} />
        <button className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          Subscribed · Cancel
        </button>
      </form>
    );
  }
  return (
    <form action={subscribe}>
      <input type="hidden" name="creatorId" value={creatorId} />
      <button className="rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700">
        Subscribe · ${(price / 100).toFixed(2)}/mo
      </button>
    </form>
  );
}

function TipForm({ creatorId }: { creatorId: string }) {
  return (
    <form action={sendTip} className="rounded border border-neutral-200 p-3">
      <div className="text-sm font-medium mb-2">Send a tip 🌮</div>
      <input type="hidden" name="creatorId" value={creatorId} />
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          min={100}
          max={50000}
          defaultValue={200}
          required
          className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <input
          name="message"
          placeholder="Optional note"
          maxLength={280}
          className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button className="rounded bg-orange-600 px-3 py-1 text-white text-sm hover:bg-orange-700">
          Tip
        </button>
      </div>
      <p className="mt-1 text-[10px] text-neutral-500">amount in cents · 200 = $2.00</p>
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
        className="rounded border border-neutral-200 p-3 hover:bg-neutral-50 flex flex-col justify-center"
      >
        <span className="text-sm font-medium">Continue conversation →</span>
        <span className="text-xs text-neutral-500">Open the message thread</span>
      </Link>
    );
  }
  return (
    <form
      action={sendMessage}
      className="rounded border border-neutral-200 p-3"
    >
      <div className="text-sm font-medium mb-2">Send a message</div>
      <input type="hidden" name="recipientId" value={recipientId} />
      <div className="flex gap-2">
        <input
          name="body"
          placeholder="Say hi..."
          required
          maxLength={2000}
          className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button className="rounded bg-neutral-900 px-3 py-1 text-white text-sm hover:bg-neutral-800">
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
    <div className="mt-3 rounded border-2 border-dashed border-orange-300 bg-orange-50 p-6 text-center">
      <div className="text-2xl mb-2">🔒</div>
      <p className="text-sm text-neutral-700 mb-3">
        Subscribe to unlock this post.
      </p>
      {signedIn ? (
        <form action={subscribe}>
          <input type="hidden" name="creatorId" value={creatorId} />
          <button className="rounded bg-orange-600 px-4 py-2 text-white text-sm font-medium hover:bg-orange-700">
            Subscribe · ${(price / 100).toFixed(2)}/mo
          </button>
        </form>
      ) : (
        <Link
          href="/sign-in"
          className="inline-block rounded bg-orange-600 px-4 py-2 text-white text-sm font-medium hover:bg-orange-700"
        >
          Sign in to subscribe
        </Link>
      )}
    </div>
  );
}
