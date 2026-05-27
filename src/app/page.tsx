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
    <div className="space-y-8">
      <section className="rounded-xl bg-white border border-neutral-200 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Premium taco content, straight from the source 🌮
        </h1>
        <p className="mt-2 text-neutral-600">
          Subscribe to your favorite taco creators for exclusive recipes,
          plating tutorials, and salsa secrets.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Discover creators</h2>
        {creators.length === 0 ? (
          <p className="text-neutral-500">
            No creators yet.{" "}
            <Link href="/sign-up" className="text-orange-600 underline">
              Be the first
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow"
              >
                <Link href={`/${c.username}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                      🌮
                    </div>
                    <div>
                      <div className="font-semibold">{c.displayName}</div>
                      <div className="text-sm text-neutral-500">
                        @{c.username}
                      </div>
                    </div>
                  </div>
                  {c.bio && (
                    <p className="mt-3 text-sm text-neutral-700 line-clamp-2">
                      {c.bio}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>{c._count.posts} posts</span>
                    <span>{c._count.subscribers} subs</span>
                    <span className="font-medium text-orange-700">
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
