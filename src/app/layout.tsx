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
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold text-xl tracking-tight">
              <span aria-hidden>🌮</span> OnlyTacos
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/inbox" className="hover:underline">
                    Inbox
                  </Link>
                  <Link href="/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link href={`/${user.username}`} className="hover:underline">
                    @{user.username}
                  </Link>
                  <form action={signOut}>
                    <button className="text-neutral-600 hover:text-neutral-900">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="hover:underline">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
          OnlyTacos · SFW content only · Built with Next.js
        </footer>
      </body>
    </html>
  );
}
