import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { becomeCreator } from "../actions";
import PostComposer from "./post-composer";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { error } = await searchParams;

  if (!user.isCreator) return <BecomeCreatorForm error={error} />;

  const [posts, subCount, subscriptions, tips, tipTotal] = await Promise.all([
    db.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.subscription.count({ where: { creatorId: user.id } }),
    db.subscription.findMany({
      where: { subscriberId: user.id },
      include: { creator: true },
      orderBy: { startedAt: "desc" },
    }),
    db.tip.findMany({
      where: { toId: user.id },
      include: { from: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.tip.aggregate({
      where: { toId: user.id },
      _sum: { amount: true },
    }),
  ]);

  const totalCents =
    user.monthlyPrice * subCount + (tipTotal._sum.amount ?? 0);

  return (
    <div className="space-y-8">
      <header className="rounded-xl bg-white border border-neutral-200 p-6">
        <h1 className="text-2xl font-bold">Creator dashboard</h1>
        <p className="text-neutral-600 mt-1">
          Welcome back, {user.displayName}. You have{" "}
          <strong>{subCount}</strong> subscriber{subCount === 1 ? "" : "s"} ·
          lifetime earnings (subs + tips): {" "}
          <strong>${(totalCents / 100).toFixed(2)}</strong>.
        </p>
        <p className="mt-2 text-sm">
          Your public page:{" "}
          <Link href={`/${user.username}`} className="text-orange-600 underline">
            /{user.username}
          </Link>
        </p>
      </header>

      <section className="rounded-xl bg-white border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold mb-4">New post</h2>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <PostComposer />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your posts</h2>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li
                key={p.id}
                className="rounded border border-neutral-200 bg-white p-3 flex items-center justify-between"
              >
                <span>
                  {p.isLocked && <span className="mr-2">🔒</span>}
                  {p.title}
                </span>
                <span className="text-xs text-neutral-500">
                  {p.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tips.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent tips</h2>
          <ul className="space-y-2">
            {tips.map((t) => (
              <li
                key={t.id}
                className="rounded border border-neutral-200 bg-white p-3"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">
                    @{t.from.username} sent ${(t.amount / 100).toFixed(2)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {t.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {t.message && (
                  <p className="mt-1 text-sm text-neutral-700">“{t.message}”</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {subscriptions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">You subscribe to</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {subscriptions.map((s) => (
              <li
                key={s.id}
                className="rounded border border-neutral-200 bg-white p-3 flex items-center justify-between"
              >
                <Link
                  href={`/${s.creator.username}`}
                  className="hover:underline"
                >
                  @{s.creator.username}
                </Link>
                <span className="text-xs text-neutral-500">
                  renews {s.expiresAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BecomeCreatorForm({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold mb-2">Become a taco creator</h1>
      <p className="text-neutral-600 mb-6">
        Set up your creator profile to start posting and earning subscriptions.
      </p>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form action={becomeCreator} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Bio</span>
          <textarea
            name="bio"
            rows={3}
            placeholder="Tell subscribers what kind of taco content to expect."
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Monthly price (cents)
          </span>
          <input
            name="monthlyPrice"
            type="number"
            defaultValue={500}
            min={100}
            max={10000}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
          <span className="block mt-1 text-xs text-neutral-500">
            500 = $5.00/month
          </span>
        </label>
        <button className="w-full rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700">
          Start creating
        </button>
      </form>
    </div>
  );
}
