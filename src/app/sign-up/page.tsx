import Link from "next/link";
import { signUp } from "../actions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md px-8 py-10">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🌮</div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Join the tastiest corner of the internet</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <Field name="displayName" label="Display name" placeholder="Taco Lover 3000" />
          <Field
            name="username"
            label="Username"
            placeholder="tacolover"
            hint="Lowercase letters, numbers, underscore."
          />
          <Field name="email" label="Email" type="email" placeholder="you@example.com" />
          <Field
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            hint="At least 6 characters."
          />

          <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3.5 py-3 cursor-pointer hover:border-orange-300 transition-colors">
            <input type="checkbox" name="isCreator" className="mt-0.5 h-4 w-4 rounded accent-orange-600" />
            <div>
              <span className="text-sm font-medium block">Become a creator</span>
              <span className="text-xs text-[var(--text-muted)]">Publish taco content and earn subscriptions</span>
            </div>
          </label>

          <button className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all mt-2">
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  hint,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
      />
      {hint && <span className="block mt-1.5 text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}
