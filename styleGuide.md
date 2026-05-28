# OnlyTacos — Style Guide

## Stack & Tooling

- **Framework:** Next.js (App Router) with React Server Components
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`)
- **Fonts:** Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) via `next/font/google`
- **Images:** `next/image` with `fill` + `object-cover` for media; `unoptimized` for user-uploaded URLs

---

## Theme

Modern, clean, and appetizing. Taco-inspired accents balanced heavily with neutral whitespace.

| Role | Tailwind class |
|---|---|
| Primary action | `bg-orange-600` / `hover:bg-orange-700` |
| Primary text link | `text-orange-600 underline` |
| Avatar placeholder bg | `bg-orange-100` |
| Locked post teaser bg | `bg-orange-50 border-orange-300` |
| Page background | `bg-neutral-50` |
| Card surface | `bg-white border border-neutral-200` |
| Muted text | `text-neutral-500` |
| Body text | `text-neutral-700` / `text-neutral-800` |
| Destructive / error | `bg-red-50 border-red-200 text-red-700` |

---

## Layout

- Max content width: `max-w-5xl mx-auto px-4`
- Page shell: `min-h-full flex flex-col` on `<body>`; `<main>` grows with `flex-1`
- Vertical section rhythm: `space-y-8` between top-level page sections
- Cards: `rounded-xl bg-white border border-neutral-200 p-6` (prominent) or `rounded-lg ... p-4` (list items) or `rounded border ... p-3` (compact)
- Responsive grids: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` for creator discovery; `grid gap-2 sm:grid-cols-2` for smaller lists

---

## Typography

| Element | Classes |
|---|---|
| Page h1 | `text-2xl font-bold` (forms/dashboard) · `text-3xl font-bold tracking-tight` (hero) |
| Section h2 | `text-xl font-semibold mb-4` · `text-lg font-semibold mb-4` |
| Post/card title | `text-lg font-semibold` |
| Metadata / timestamps | `text-xs text-neutral-500` |
| Hint / caption | `text-xs text-neutral-500` |
| Form label | `text-sm font-medium mb-1` |
| Nav links | `text-sm hover:underline` |
| Logo / wordmark | `font-bold text-xl tracking-tight` |

---

## Components & Patterns

### Buttons

```tsx
// Primary
<button className="rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700 disabled:opacity-50">
// Secondary / outline
<button className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
// Small primary (inline)
<button className="rounded bg-orange-600 px-3 py-1 text-white text-sm hover:bg-orange-700">
// Dark (e.g. send message)
<button className="rounded bg-neutral-900 px-3 py-1 text-white text-sm hover:bg-neutral-800">
```

### Form Inputs

```tsx
// Text / email / password / number
<input className="w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
// Textarea
<textarea className="w-full rounded border border-neutral-300 px-3 py-2" />
// Compact inline input
<input className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
```

### Avatar Placeholder

```tsx
<div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
  🌮
</div>
```
Large variant: `h-20 w-20 ... text-3xl`. Inbox variant: `h-10 w-10`.

### Error Banner

```tsx
<div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
  {error}
</div>
```

### Locked Post Teaser

Dashed orange border, centered call-to-action, `🔒` icon at `text-2xl`.

```tsx
<div className="mt-3 rounded border-2 border-dashed border-orange-300 bg-orange-50 p-6 text-center">
```

### Image Media

Aspect-ratio container with `next/image fill`:

```tsx
<div className="mt-3 relative w-full aspect-video rounded overflow-hidden bg-neutral-100">
  <Image src={url} alt="" fill className="object-cover" unoptimized />
</div>
```

---

## Server vs Client Components

- Default to **Server Components** for all data-fetching pages.
- Use `"use client"` only when browser APIs or React state are required (e.g., `PostComposer` for file upload and `useState`).
- Keep client component surface area minimal; pass pre-fetched data down as props.

---

## Next.js Conventions

- Route handlers live in `src/app/api/*/route.ts`.
- Server Actions are defined in `src/app/actions.ts` and imported into page components.
- Auth helpers in `src/lib/auth.ts`; DB client in `src/lib/db.ts`.
- Dynamic params arrive as `Promise<{ param: string }>` — always `await params` before destructuring.
- `searchParams` is also a `Promise` in this version — `await searchParams` before reading error keys.
- Redirect with `redirect()` from `next/navigation` at the top of page components for auth guards.

---

## Do / Don't

| Do | Don't |
|---|---|
| Use Tailwind utility classes inline | Write custom CSS unless unavoidable |
| Scope state to the smallest client component possible | Wrap entire pages in `"use client"` |
| Use `next/image` for post media | Use bare `<img>` except for previews of freshly uploaded blobs |
| Follow the card/section rhythm above | Invent new spacing scales |
| Use `space-y-8` between major page sections | Nest `space-y-*` arbitrarily deep |
| Keep forms as Server Action forms | Add client-side fetch unless upload/interactivity requires it |
