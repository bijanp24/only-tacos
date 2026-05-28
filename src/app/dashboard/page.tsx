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

  const totalCents = user.monthlyPrice * subCount + (tipTotal._sum.amount ?? 0);

  return (
    <div className="space-y-8">
      {/* ── Stats header ── */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Creator dashboard</h1>
            <p className="mt-1 text-orange-100">Welcome back, {user.displayName}</p>
          </div>
          <Link
            href={`/${user.username}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-4 py-2 text-sm font-semibold transition-colors"
          >
            View public page →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Subscribers" value={String(subCount)} />
          <StatCard label="Lifetime earnings" value={`$${(totalCents / 100).toFixed(2)}`} />
          <StatCard label="Posts" value={String(posts.length)} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      {/* ── New post ── */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-5">New post</h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <PostComposer />
      </section>

      {/* ── Posts list ── */}
      <section>
        <h2 className="text-lg font-bold mb-4">Your posts</h2>
        {posts.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No posts yet. Publish your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between gap-4 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {p.isLocked && (
                    <span className="shrink-0 text-xs rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700 ring-1 ring-orange-200">
                      🔒 Paid
                    </span>
                  )}
                  <span className="text-sm font-medium truncate">{p.title}</span>
                </div>
                <span className="shrink-0 text-xs text-[var(--text-subtle)]">
                  {p.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Recent tips ── */}
      {tips.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Recent tips</h2>
          <ul className="space-y-2">
            {tips.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium">
                    <span className="text-[var(--text-muted)]">@{t.from.username}</span>{" "}
                    sent{" "}
                    <span className="text-orange-600 font-semibold">${(t.amount / 100).toFixed(2)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-subtle)]">
                    {t.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {t.message && (
                  <p className="mt-1 text-sm text-[var(--text-muted)] italic">"{t.message}"</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Subscriptions ── */}
      {subscriptions.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">You subscribe to</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {subscriptions.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between gap-4"
              >
                <Link
                  href={`/${s.creator.username}`}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  @{s.creator.username}
                </Link>
                <span className="text-xs text-[var(--text-subtle)]">
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

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white/15 px-4 py-3 ${className}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-orange-100 mt-0.5">{label}</div>
    </div>
  );
}

function BecomeCreatorForm({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md px-8 py-10">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🌮</div>
          <h1 className="text-2xl font-bold tracking-tight">Become a creator</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Start posting taco content and earn subscriptions
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={becomeCreator} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Bio</span>
            <textarea
              name="bio"
              rows={3}
              placeholder="Tell subscribers what kind of taco content to expect."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Monthly price (cents)</span>
            <input
              name="monthlyPrice"
              type="number"
              defaultValue={500}
              min={100}
              max={10000}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
            <span className="block mt-1.5 text-xs text-[var(--text-muted)]">
              500 = $5.00/month
            </span>
          </label>
          <button className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all">
            Start creating
          </button>
        </form>
      </div>
    </div>
  );
}
