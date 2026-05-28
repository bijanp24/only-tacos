import Link from "next/link";
import { signIn } from "../actions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      {/* Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md px-8 py-10">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🌮</div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to your OnlyTacos account</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </label>
          <button className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all mt-2">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          No account?{" "}
          <Link href="/sign-up" className="font-medium text-orange-600 hover:text-orange-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
