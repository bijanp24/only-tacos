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
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form action={signUp} className="space-y-4">
        <Field name="displayName" label="Display name" />
        <Field
          name="username"
          label="Username"
          hint="Lowercase letters, numbers, underscore."
        />
        <Field name="email" label="Email" type="email" />
        <Field
          name="password"
          label="Password"
          type="password"
          hint="At least 6 characters."
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCreator" className="rounded" />
          I want to publish taco content as a creator
        </label>
        <button className="w-full rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700">
          Sign up
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        name={name}
        type={type}
        required
        className="w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      {hint && <span className="block mt-1 text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}
