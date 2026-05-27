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
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form action={signIn} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Password</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>
        <button className="w-full rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700">
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600">
        No account?{" "}
        <Link href="/sign-up" className="text-orange-600 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
