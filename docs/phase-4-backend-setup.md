# Phase 4 Backend Setup (Accounts, Synced Favorites, Brew Notes)

BeanMap runs **fully without a backend** — sharing, OG images, local favorites, and
the discover feed all work with no configuration. The features below light up
only once you provision the services and set the environment variables. Until
then the app degrades gracefully: the account menu shows **Sign in**, favorites
stay in `localStorage`, and the note APIs return `503 not_configured`.

## What these features add

| Feature | Needs |
| --- | --- |
| Google / GitHub sign-in (4.6) | `AUTH_SECRET` + OAuth app credentials |
| Favorites synced across devices (4.7) | Auth + database |
| Personal brew notes / journal (4.8) | Auth + database |

## Required environment variables

Copy `.env.example` → `.env` (or `.env.local`) and fill in:

```
DATABASE_URL=postgres://...            # Neon connection string
AUTH_SECRET=...                         # openssl rand -base64 33  (or: npx auth secret)
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
NEXT_PUBLIC_SITE_URL=https://your-domain   # for absolute OG image / share URLs
```

## 1. Database (Neon Postgres)

1. Create a free project at <https://neon.tech> and copy the connection string
   into `DATABASE_URL`.
2. Create the tables:
   ```bash
   npm run db:generate   # already committed as drizzle/0000_*.sql — safe to re-run
   npm run db:migrate    # applies migrations to DATABASE_URL
   # or, for a quick dev sync without migration files:
   npm run db:push
   ```
3. Inspect with `npm run db:studio` if you like.

Schema lives in [`src/db/schema.ts`](../src/db/schema.ts): `user`, `account`,
`session`, `verificationToken` (Auth.js standard), plus `favorite` and
`brew_note`.

## 2. Google OAuth

1. <https://console.cloud.google.com> → **APIs & Services → Credentials →
   Create credentials → OAuth client ID → Web application**.
2. Authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain/api/auth/callback/google` (prod)
3. Put the client ID/secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

## 3. GitHub OAuth

1. <https://github.com/settings/developers> → **New OAuth App**.
2. Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (dev)
   - `https://your-domain/api/auth/callback/github` (prod)
3. Put the client ID/secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.

## 4. Auth secret

```bash
npx auth secret        # writes AUTH_SECRET, or:
openssl rand -base64 33
```

## 5. Run & verify

```bash
npm run dev
```

- **Sign in** (top-right) with Google or GitHub → a row appears in the `user`
  and `account` tables on first login.
- Favorite a bean while signed out, then sign in → the local favorite is
  **merged** into your account (union), and future toggles hit the API.
  (See [`src/lib/use-favorites-sync.ts`](../src/lib/use-favorites-sync.ts).)
- On any bean page, add a **brew note** (method, rating, tasting notes, date);
  edit and delete it; find all notes in the **Brewing journal** at `/notes`
  (also linked from the account menu).

## Architecture notes

- **Auth strategy**: NextAuth v5 (Auth.js) with JWT sessions; the Drizzle
  adapter persists users/accounts. Config in [`src/auth.ts`](../src/auth.ts).
- **Route protection** is per-route via `auth()` (API routes return `401`; the
  notes UI shows a sign-in prompt) rather than in middleware — this keeps the
  next-intl `proxy.ts` middleware untouched and preserves static generation of
  all content pages. The `SessionProvider` is client-side, so `/`, `/beans`,
  `/favorites`, `/notes`, and every bean page remain statically rendered.
- **Graceful degradation**: `src/db/index.ts` (`getDb`/`isDbConfigured`) and
  `src/auth.ts` never touch the database or throw at import time, so
  `npm run build` succeeds and the app runs with none of the above env vars set.
- The API routes (`/api/favorites`, `/api/favorites/[beanSlug]`, `/api/notes`,
  `/api/notes/[id]`) are all auth-gated and scoped by `userId`.
