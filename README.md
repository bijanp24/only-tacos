# OnlyTacos 🌮

A safe-for-work creator subscription platform (think OnlyFans, but for taco
recipes, salsa tutorials, and trompo techniques). Built with Next.js 16, Prisma,
and SQLite.

## Features

- **Creator profiles** with bio, monthly subscription price, and feed of posts.
- **Paywalled posts** — creators can mark posts as subscribers-only; non-subscribers see a 🔒 teaser.
- **Subscriptions** (stubbed, no payment processor): one-month renewable access.
- **Tips** with optional message; lifetime earnings shown in the creator dashboard.
- **Direct messages** between any two users — inbox view + threaded conversation.
- **Image uploads** to `public/uploads/` (8 MB / png|jpg|webp|gif).
- Session-cookie auth (bcrypt + DB-backed sessions; no external auth provider).

## Quick start

```bash
npm install
npx prisma db push       # create SQLite schema
npx prisma db seed       # seed demo creators + fan
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins (all password `password123`)

| Email | Role |
| --- | --- |
| `carla@onlytacos.test` | Creator with locked + unlocked posts |
| `diego@onlytacos.test` | Creator (existing convo with fan) |
| `fan@onlytacos.test` | Non-creator, already subscribed to Diego |

## Project layout

```
src/
  app/
    actions.ts              server actions: auth, posts, subs, tips, messages
    layout.tsx              shell + nav
    page.tsx                home / discover creators
    sign-in/  sign-up/      auth pages
    [username]/page.tsx     creator profile (paywall, tip, message)
    dashboard/              creator dashboard + composer
    inbox/                  DM list + thread page
    api/upload/             image upload endpoint
  lib/
    db.ts                   Prisma client singleton
    auth.ts                 session cookie + getCurrentUser()
    subscriptions.ts        isSubscribed() check
    conversations.ts        canonical pair helper
prisma/
  schema.prisma             User, Post, Subscription, Tip, Conversation, Message, Session
  seed.ts                   demo data
```

## Not implemented (on purpose)

- **Real payments.** `subscribe` / `sendTip` just write rows. To wire Stripe Checkout: create a session in `subscribe`, redirect to the URL, then move the DB write into a webhook handler.
- **Postgres.** SQLite for zero-setup local dev. Swap `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma` and point `url` at a real DB.
- **Realtime DMs.** Messages render on next request; no websockets / polling.
- **Moderation, age verification, KYC.** OnlyTacos is SFW by design.

## License

MIT.
