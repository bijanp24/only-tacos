import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OnlyTacos",
  description: "Premium taco content from your favorite creators.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
          <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl leading-none">🌮</span>
              <span>OnlyTacos</span>
            </Link>

            <nav className="flex items-center gap-1 text-sm font-medium">
              {user ? (
                <>
                  <Link
                    href="/inbox"
                    className="px-3 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Inbox
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/${user.username}`}
                    className="px-3 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    @{user.username}
                  </Link>
                  <form action={signOut} className="ml-1">
                    <button className="px-3 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-3 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="ml-1 rounded-lg bg-orange-600 px-4 py-1.5 text-white font-semibold shadow-sm hover:bg-orange-700 active:scale-95 transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8">
          <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-subtle)]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-muted)]">
              🌮 OnlyTacos
            </span>
            <span>SFW taco content only · Built with Next.js</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
