import Link from "next/link";
import { db } from "@/lib/db";

export default async function HomePage() {
  const creators = await db.user.findMany({
    where: { isCreator: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true, subscribers: true } },
    },
    take: 24,
  });

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-8 py-14 text-center text-white shadow-lg">
        {/* decorative background blobs */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative space-y-4">
          <div className="text-5xl">🌮</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Premium taco content,<br className="hidden sm:block" /> straight from the source
          </h1>
          <p className="mx-auto max-w-md text-orange-100 text-base">
            Subscribe to your favorite taco creators for exclusive recipes,
            plating tutorials, and salsa secrets.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/sign-up"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 shadow hover:bg-orange-50 active:scale-95 transition-all"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Creator grid ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">Discover creators</h2>
          <span className="text-sm text-[var(--text-muted)]">{creators.length} creator{creators.length !== 1 ? "s" : ""}</span>
        </div>

        {creators.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
            <div className="text-4xl mb-3">🌮</div>
            <p className="text-[var(--text-muted)] mb-4">No creators yet.</p>
            <Link
              href="/sign-up"
              className="inline-block rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              Be the first creator
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${c.username}`}
                  className="group flex flex-col h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-xl shadow-sm">
                      🌮
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate group-hover:text-orange-600 transition-colors">
                        {c.displayName}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] truncate">
                        @{c.username}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {c.bio && (
                    <p className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2 flex-1">
                      {c.bio}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div className="flex gap-3 text-[var(--text-subtle)]">
                      <span>{c._count.posts} posts</span>
                      <span>{c._count.subscribers} subs</span>
                    </div>
                    <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-semibold text-orange-700 ring-1 ring-orange-200">
                      ${(c.monthlyPrice / 100).toFixed(2)}/mo
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
