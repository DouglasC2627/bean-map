# BeanMap

An interactive world map of specialty coffee — origins, flavor profiles, brewing recommendations, and an interactive flavor wheel tailored to each bean.

**Status:** *Still Under Development* — Phases 1 & 2 complete; Phase 3 substantially complete; **Phase 4 (Social & Community) complete**; fully bilingual (English + Traditional Chinese, Taiwan). 55 bean profiles across 41 countries with full SCA flavor-note tagging, a Bean Belt overlay tracing the equatorial coffee-growing band on the globe, custom Mapbox styles, SSR bean pages with per-bean flavor-driven gradient art and "Did you know?" trivia, a responsive panel with a draggable mobile bottom sheet, dark/light mode, faceted filters, ⌘K search, brewing recommendation cards with dose calculator + interactive brew timer, a /beans browser with grid/table toggle, Euclidean similar-beans, side-by-side bean comparison, a D3 flavor wheel with category/subcategory/note filtering, a complete MDX-powered Learn section (13 articles with embedded SVG diagrams and timers), shareable URLs, and **`/zh-TW/` locale routing with an in-nav language switcher** — every UI string, all catalog content (beans, brewing methods, the SCA flavor hierarchy, country names), and all 13 Learn articles are translated.

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Map:** [react-map-gl](https://visgl.github.io/react-map-gl/) + [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (globe projection, clustering, custom [Mapbox Studio](https://studio.mapbox.com/) styles)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (on top of [Base UI](https://base-ui.com/)) + custom coffee color palette
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **i18n:** [`next-intl`](https://next-intl.dev/) — locale-prefixed routing (`/en/…`, `/zh-TW/…`) via a Next.js 16 proxy, message catalogs, and server + client translations. English (`en`) is the source language; Traditional Chinese / Taiwan (`zh-TW`) is a full translation
- **URL state:** [`nuqs`](https://nuqs.47ng.com/) — type-safe URL search params, shallow routing
- **Search:** [Fuse.js](https://www.fusejs.io/) (weighted, fuzzy)
- **Data viz:** [d3-hierarchy](https://github.com/d3/d3-hierarchy) + [d3-shape](https://github.com/d3/d3-shape) (sunburst flavor wheel); pure SVG everywhere else
- **Gestures:** [`@use-gesture/react`](https://use-gesture.netlify.app/) + [`@react-spring/web`](https://www.react-spring.dev/) (draggable mobile bottom sheet)
- **Content:** [`next-mdx-remote`](https://github.com/hashicorp/next-mdx-remote) (RSC) + [`gray-matter`](https://github.com/jonschlinkert/gray-matter) + [`remark-gfm`](https://github.com/remarkjs/remark-gfm) (tables) for the Learn section
- **Data:** JSON seed files validated with [Zod](https://zod.dev/) at build time
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes) (Mapbox style swaps on toggle)
- **Auth:** [NextAuth v5 / Auth.js](https://authjs.dev/) — Google + GitHub OAuth, JWT sessions, Drizzle adapter *(optional — see [Accounts & backend](#accounts--backend-optional))*
- **Database:** [Neon](https://neon.tech/) serverless Postgres + [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`, for account favorites and brew notes *(optional)*
- **Social previews:** [`next/og`](https://nextjs.org/docs/app/api-reference/functions/image-response) (Satori) for dynamic OG images with a live flavor radar; [`html-to-image`](https://github.com/bubkoo/html-to-image) for downloadable recipe cards
- **Notifications:** [`sonner`](https://sonner.emilkowal.ski/) toasts, styled in the coffee palette
- **Deploy:** [Vercel](https://vercel.com/)

## Feature highlights

- **Interactive map** — Mapbox globe with clustered bean markers, on-hover region highlights, and a **Bean Belt** overlay: the equatorial band between the Tropics of Cancer and Capricorn (~23.44°) where virtually all coffee grows, drawn as densified, globe-hugging dashed parallels with a shaded fill and a curved label. Click a marker to fly to the origin and open its profile.
- **Bean profiles** — 55 beans across 41 countries. Each carries a 6-axis flavor profile (acidity, body, sweetness, bitterness, complexity, fruitiness), tagged tasting notes, varieties, processing, harvest months, and an SSR detail page whose header is filled with a deterministic gradient generated from the bean's own flavor profile (see [src/lib/flavor-gradient.ts](src/lib/flavor-gradient.ts)). Selected beans include a "Did you know?" trivia note, and a similar-beans section uses Euclidean distance over the flavor profile to surface related origins from other countries. Processing fields link straight to the matching Learn article.
- **Brewing recommendations** — Per-bean cards sorted by affinity score with a "Best Match" highlight. Open any card for a full recipe — grind-scale visualization, water temperature with °C/°F toggle, ratio, pour schedule, equipment list, and an embedded dose calculator that scales by cup count and persists the user's preferred cup size.
- **Interactive brew timer** — Drift-free `requestAnimationFrame` timer with circular progress ring, automatic stage advancement, opt-in Web Audio API beep on stage transitions, `Space` to start/pause, and `prefers-reduced-motion` support. Lives inside the brew detail modal (which also links out to the matching brewing guide) and is exposed as `<BrewTimer />` to MDX articles.
- **SCA flavor wheel** — D3-driven sunburst at [/explore/flavors](http://localhost:3000/explore/flavors) and as a toggleable overlay on the map. Click any segment — category, subcategory, or specific note — to filter beans across the whole app. The SVG scales fluidly to any viewport (no horizontal overflow on mobile), includes a screen-reader-only data table, and is lazy-loaded so D3 stays out of the initial bundle.
- **Bean comparison** — Add up to three beans to the comparison tray, then open the side-by-side view with overlaid radar charts, a parameter table, and a "best for [method]" highlight. Shareable via `/compare?beans=slug1,slug2,slug3`.
- **Insights** — `/explore/insights` shows aggregate visualizations across the (filtered) catalog: an altitude bar chart with green→brown gradient sorted by midpoint elevation, and a Gantt-style harvest calendar that highlights the current month.
- **Learn section** — 13 MDX-rendered articles at `/learn`: 5 processing methods (washed, natural, honey, anaerobic, wet-hulled) and 8 brewing guides (V60, Chemex, Kalita Wave, French Press, AeroPress, Espresso, Cold Brew, Moka Pot). Each processing article embeds a theme-aware `<ProcessDiagram />` SVG of the workflow; brewing guides embed a live `<BrewTimer />`. GitHub-flavored markdown tables are supported via `remark-gfm`.
- **Mobile** — Bean panel becomes a draggable bottom sheet with three snap points (peek, half, full), flick-to-close, and a dimmed backdrop. Filters open as a bottom sheet too.
- **Search** — ⌘K opens a fuzzy search across name, country, region, and flavor notes. Recent searches persist in `localStorage`.
- **SCA flavor-notes hierarchy** — 9 categories / 29 subcategories / 84 specific notes in [src/data/flavor-notes.json](src/data/flavor-notes.json), cross-validated against every bean at build time.
- **Shareable URLs** — `nuqs` syncs selected bean, map viewport, all filters (region, processing, roast, altitude, flavor notes) into the URL with shallow routing.
- **Sharing & dynamic OG images** — a Share control (native Web Share API on mobile, copy-to-clipboard with a toast on desktop) on bean, comparison, and recipe views. Links unfurl with **on-the-fly Open Graph cards** rendered by [`/api/og`](src/app/api/og/route.tsx) — bean and comparison cards drawn with the flavor radar as inline SVG, over a warm roast gradient — plus a dedicated recipe card at [`/api/og/recipe`](src/app/api/og/recipe/route.tsx). Fully static bean pages are preserved: recipe links get their own permalink route ([`/bean/[slug]/recipe/[method]`](src/app/[locale]/bean/[slug]/recipe/[method]/page.tsx)) instead of query-param metadata.
- **Shareable brew recipes** — a "Share recipe" action in the brew detail modal opens a branded card you can **copy as a permalink** or **download as a PNG** (via `html-to-image`), showing grind, temperature, ratio, and time.
- **Accounts (optional)** — sign in with Google or GitHub (NextAuth v5). A default-avatar button in the nav opens a branded sign-in dialog; signed in, it becomes your avatar with an account menu. Everything works signed-out too — accounts only add favorites and notes.
- **Favorites** — heart any bean to save it to your account (signed out, the heart prompts you to sign in). The [`/favorites`](src/app/[locale]/favorites/page.tsx) page sorts by date added / name / region and exports to JSON; favorites are the source of truth on the server and load on sign-in.
- **Brewing journal** — signed-in users can log **private brew notes** on any bean (method, 1–5★ rating, tasting notes, brew date), shown as an author-only timeline on the bean page and collected in the [`/notes`](src/app/[locale]/notes/page.tsx) journal with inline edit/delete.
- **Discover collections** — the top of `/beans` leads with curated and seasonal rows — **In season now** (driven by each bean's harvest months, refreshed daily), **Editor's picks**, and **New additions** — above the full filterable catalog.
- **Bilingual (English + 繁體中文)** — every route is served under a locale prefix (`/en/…`, `/zh-TW/…`) and a language switcher in the nav flips locale while preserving the current path *and* all `nuqs` query state (filters, selection, viewport). UI strings come from `next-intl` message catalogs; catalog content (bean names, descriptions, fun facts, tasting notes, brewing methods, the SCA flavor hierarchy, country names) is localized via id-keyed overlays merged onto the English source; all 13 Learn articles have Traditional Chinese counterparts. `⌘K` search indexes localized names *and* flavor labels, so you can search in Chinese. See [Internationalization](#internationalization-i18n).
**Social & Community** - Web Share API social sharing with clipboard fallback, **dynamic Open Graph images** rendered with a flavor radar, **shareable brew-recipe cards** (copyable permalink *and* downloadable PNG), **account-synced favorites** and a **private brewing journal**. The account layer is *entirely optional* — with no database or auth secrets set, the app still builds and runs. See [Accounts &amp; backend](#accounts--backend-optional).

## Internationalization (i18n)

- **Routing** — `next-intl` with `localePrefix: "always"`. The whole route tree lives under `src/app/[locale]/…`; the locale layout sets `<html lang>`, loads the right message catalog, and adds a Traditional-Chinese font (Noto Sans/Serif TC) that only downloads for `zh-TW`. A Next.js 16 proxy ([src/proxy.ts](src/proxy.ts)) negotiates the locale and redirects `/` → `/en`.
- **UI strings** — namespaced message catalogs in [messages/en.json](messages/en.json) + [messages/zh-TW.json](messages/zh-TW.json), consumed with `getTranslations` (server) / `useTranslations` (client).
- **Catalog content** — English JSON in `src/data/` stays the source of truth; each locale adds a terse, **id-keyed overlay** that translates only display strings. See [src/data/i18n/zh-TW/](src/data/i18n/zh-TW/) (`beans.json`, `brewing-methods.json`, `flavor-notes.json`) and the shared country map [src/data/i18n/countries.json](src/data/i18n/countries.json). The loaders in [src/lib/data.ts](src/lib/data.ts) Zod-validate the English base, then deep-merge the overlay for the requested locale.
- **Articles** — MDX lives under `src/content/<locale>/<category>/<slug>.mdx`. A missing `zh-TW` article falls back to English, so the Learn section never 404s mid-translation.
- **Validation** — `npm run validate:data` fails the build if any bean/method/flavor id or country lacks a `zh-TW` overlay entry, or if the `en` and `zh-TW` message catalogs drift out of key parity.

## Accounts & backend (optional)

The entire catalog experience — map, search, filters, brewing tools, comparison, Learn, sharing, and dynamic OG images — is **fully static and needs only a Mapbox token**. Accounts add one thing: personal data that follows you across devices (synced favorites and private brew notes).

- **Graceful degradation** — with no `DATABASE_URL` / `AUTH_SECRET` set, the app still builds and runs. The account avatar shows a sign-in prompt, the favorite heart and note forms nudge you to sign in, and the account APIs return `503 not_configured`. Nothing crashes; [src/db/index.ts](src/db/index.ts) and [src/auth.ts](src/auth.ts) never touch the database at import time.
- **What you provision** — a free [Neon](https://neon.tech/) Postgres database and Google + GitHub OAuth apps. Full step-by-step instructions are in **[docs/phase-4-backend-setup.md](docs/phase-4-backend-setup.md)**. In short: set `DATABASE_URL`, run `npm run db:migrate` to create the tables, then set `AUTH_SECRET` + the OAuth credentials.
- **Auth** — NextAuth v5 (Auth.js) with **JWT sessions**; the [Drizzle adapter](https://authjs.dev/getting-started/adapters/drizzle) persists the `user`/`account` rows on first sign-in ([src/auth.ts](src/auth.ts)). The client `SessionProvider` keeps every content page statically rendered — auth is checked **per-route** (`auth()` in the API routes and note UI), not in middleware, so the next-intl proxy stays untouched.
- **Data model** — [src/db/schema.ts](src/db/schema.ts): the Auth.js standard tables (`user`, `account`, `session`, `verificationToken`) plus `favorite` (unique per user+bean) and `brew_note`. The auth-gated, `userId`-scoped API lives under [src/app/api/](src/app/api/) (`favorites`, `favorites/[beanSlug]`, `notes`, `notes/[id]`).
- **Favorites sync** — favorites require an account and the server is the source of truth: they load into a Zustand store on sign-in ([src/lib/use-favorites-sync.ts](src/lib/use-favorites-sync.ts)) and toggle optimistically with rollback on failure.

## Local development

### Prerequisites

- Node.js 20+
- A [Mapbox account](https://account.mapbox.com/) and access token

### Setup

```bash
git clone https://github.com/DouglasC2627/bean-map.git
cd bean-map
npm install
cp .env.example .env.local
# edit .env.local with your Mapbox token (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Name | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public access token (`pk.*`) |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | No | Custom Mapbox Studio style URL for light mode. Falls back to `mapbox://styles/mapbox/light-v11` |
| `NEXT_PUBLIC_MAPBOX_STYLE_DARK` | No | Custom Mapbox Studio style URL for dark mode. Falls back to `mapbox://styles/mapbox/dark-v11` |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin (e.g. `https://beanmap.app`) for OG image + share URLs. Falls back to `VERCEL_URL`, then `http://localhost:3000` |
| `DATABASE_URL` | Backend | Neon Postgres connection string — enables accounts, synced favorites, and brew notes |
| `AUTH_SECRET` | Backend | Auth.js session secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Backend | Google OAuth credentials |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Backend | GitHub OAuth credentials |

The `NEXT_PUBLIC_*` vars are inlined into the client bundle at build time — changing them requires a rebuild. The **Backend** group is optional: leave it unset to run in public/local-only mode, or configure it per [Accounts & backend](#accounts--backend-optional) to enable sign-in, synced favorites, and brew notes. `drizzle-kit` reads `.env` / `.env.local` via [drizzle.config.ts](drizzle.config.ts).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Run Zod validation, then production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run validate:data` | Validate [src/data/](src/data/) against Zod schemas + cross-check flavor-note IDs, method IDs, and related-bean IDs; also assert every `zh-TW` content overlay + country name is present and that the `en`/`zh-TW` message catalogs match key-for-key |
| `npm run expand:brewing` | Regenerate missing brewing recommendations via affinity weights |
| `npm run new:bean` | Interactive scaffolder that prompts for every field and appends a new bean profile to `beans.json` |
| `npm run db:generate` | Generate a Drizzle migration in `drizzle/` from [src/db/schema.ts](src/db/schema.ts) |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push the schema directly to the database (quick dev sync, no migration files) |
| `npm run db:studio` | Open Drizzle Studio to browse the database |

## Project structure

```
bean-map/
├── src/
│   ├── app/        # Next.js App Router — all routes live under [locale]
│   │   ├── [locale]/
│   │   │   ├── bean/[slug]/       # SSR bean detail page (generateStaticParams) — share, favorite, brew-notes island
│   │   │   │   └── recipe/[method]/    # Shareable recipe permalink (own dynamic OG card)
│   │   │   ├── beans/             # /beans — discovery collections + grid/table browser
│   │   │   ├── favorites/         # /favorites — account-synced saved beans (+ JSON export)
│   │   │   ├── notes/             # /notes — private brewing journal
│   │   │   ├── compare/           # /compare?beans=slug1,slug2,slug3
│   │   │   ├── explore/
│   │   │   │   ├── flavors/            # D3 flavor wheel + matched beans list
│   │   │   │   └── insights/           # Altitude chart + harvest calendar
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx            # Hub listing processing + brewing articles
│   │   │   │   ├── processing/[slug]/  # MDX article renderer
│   │   │   │   └── brewing/[slug]/     # MDX article renderer
│   │   │   ├── layout.tsx         # Locale (root) layout — <html lang>, fonts, ThemeProvider, NuqsAdapter, NextIntlClientProvider, SessionProvider, TopNav, Toaster, SignInDialog
│   │   │   └── page.tsx           # Home (map view)
│   │   ├── api/               # Route handlers (not locale-prefixed)
│   │   │   ├── og/                # Dynamic OG images (bean + comparison); og/recipe/ for recipe cards
│   │   │   ├── auth/[...nextauth]/    # NextAuth v5 handlers
│   │   │   ├── favorites/         # GET/POST + [beanSlug] DELETE (auth-gated, userId-scoped)
│   │   │   └── notes/             # GET/POST + [id] PATCH/DELETE (auth-gated, userId-scoped)
│   │   ├── globals.css        # Tailwind v4 theme + coffee palette
│   │   └── favicon.ico, icon.png, apple-icon.png   # Global metadata files (not locale-prefixed)
│   │
│   ├── auth.ts     # NextAuth v5 config (Google/GitHub, JWT sessions, Drizzle adapter) — optional backend
│   ├── db/         # Drizzle: schema.ts (user/account/favorite/brew_note …) + index.ts (lazy Neon client, isDbConfigured)
│   │
│   ├── i18n/       # next-intl config
│   │   ├── routing.ts         # Locales (en, zh-TW), defaultLocale, localePrefix: "always"
│   │   ├── request.ts         # getRequestConfig — loads messages/<locale>.json
│   │   └── navigation.ts      # Locale-aware Link / useRouter / usePathname
│   ├── proxy.ts    # next-intl locale negotiation (Next.js 16 proxy, formerly middleware)
│   │
│   ├── components/
│   │   ├── map/               # CoffeeMap, MapView, BeanBelt, RegionHighlight, FlavorWheelOverlay
│   │   ├── bean/              # BeanPanel, BeansBrowser, BeanCard, BeanCollections, FavoritesBrowser, BrewNotesSection
│   │   ├── filter/            # FilterPanel, FlavorSliders, ActiveFilters
│   │   ├── brewing/           # BrewCard, BrewDetailModal, BrewCalculator, BrewTimer, ShareRecipeCard, BrewNoteForm, NotesJournal
│   │   ├── compare/           # ComparisonTray, ComparisonView, CompareToggle
│   │   ├── visualization/     # FlavorRadar, FlavorWheel(+Lazy), ProcessDiagram, AltitudeChart, SeasonalChart
│   │   ├── layout/            # TopNav, LocaleSwitcher, MobileBottomSheet, UserMenu
│   │   ├── shared/            # ThemeProvider, ThemeToggle, SearchCommand, UrlStateSync, ShareButton, FavoriteButton,
│   │   │                      #   Toaster, SignInDialog, BrandIcons, SessionProviderWrapper, FavoritesSync
│   │   └── ui/                # shadcn/ui primitives (Button, Dialog, Sheet, Slider, …)
│   │
│   ├── content/    # MDX articles for the Learn section, per locale (English is source; zh-TW falls back to en)
│   │   ├── en/{processing,brewing}/
│   │   └── zh-TW/{processing,brewing}/
│   │
│   ├── lib/
│   │   ├── data.ts               # Locale-aware bean / method / flavor-notes loaders (base + id-keyed overlay merge, per-locale cache)
│   │   ├── schemas.ts            # Zod schemas mirroring src/types
│   │   ├── search.ts             # Fuse.js index (localized names + flavor labels) + recent-searches helpers
│   │   ├── similar.ts            # Euclidean distance over flavor profile
│   │   ├── flavor-gradient.ts    # Deterministic CSS gradient from a bean's flavor profile
│   │   ├── flavor-icons.ts       # Category → illustration/emoji map for the flavor wheel
│   │   ├── mdx.ts                # Locale-aware article loaders (per-locale dirs, English fallback) + shared MDXRemote render options (gray-matter, remark-gfm)
│   │   ├── mdx-components.tsx    # MDX components map (BrewTimer, ProcessDiagram, Callout, tables, prose styles)
│   │   ├── url-state.ts          # nuqs parsers for filters / viewport / selection
│   │   ├── motion.ts             # Shared Framer Motion variants
│   │   ├── use-locate-bean.ts    # Fly-to-and-select helper shared across views
│   │   ├── use-media-query.ts    # SSR-safe matchMedia hook + prefers-reduced-motion helper
│   │   ├── use-favorites-sync.ts # Loads account favorites into the store on sign-in
│   │   ├── site.ts               # Absolute site URL / metadataBase resolver (OG + share links)
│   │   ├── radar-geometry.ts     # Pure flavor-radar geometry (shared by the component + OG routes)
│   │   ├── radar-svg.ts          # Flavor radar as an SVG data URI for OG images
│   │   ├── notes-types.ts        # Shared brew-note types
│   │   └── utils.ts              # cn(), country flags, formatters, flavor-note label lookup
│   │
│   ├── store/      # Zustand stores — map/filter (+ flavor-note hierarchy match), favorites, auth-dialog
│   ├── types/      # TypeScript interfaces (+ next-auth.d.ts session augmentation)
│   └── data/       # beans.json, brewing-methods.json, flavor-notes.json, discover.json (English source of truth)
│       └── i18n/                   # Translation overlays
│           ├── countries.json          # ISO-2 → { en, zh-TW } country names
│           └── zh-TW/{beans,brewing-methods,flavor-notes}.json  # id-keyed zh-TW overlays
│
├── messages/       # next-intl UI string catalogs — en.json, zh-TW.json (kept in key parity)
│
├── public/
│   └── data/       # regions.geojson (fetched at runtime by the map)
│       ├── extracted-geojsons/   # Per-region GADM source extracts
│       └── merge-geojson.py      # Merge per-region GADM extracts → regions.geojson
│
├── scripts/
│   ├── validate-data.ts          # Zod validation + cross-checks — runs before `next build`
│   ├── expand-brewing-recs.mjs   # Generate missing brewing recs by affinity
│   └── new-bean.mjs              # Interactive scaffolder (`npm run new:bean`)
│
├── drizzle/        # Generated SQL migrations (drizzle-kit)
├── drizzle.config.ts  # Drizzle Kit config — loads .env, points at src/db/schema.ts
├── docs/           # phase-4-backend-setup.md (accounts + database setup guide)
├── .env.example    # Env var template
├── AGENTS.md       # Agent-facing notes (Next.js 16 caveats)
├── CLAUDE.md       # Claude Code project instructions
├── TASKS.md        # Phased roadmap (source of truth)
└── package.json
```

## Contributing data

### Bean profiles

Bean profiles live in [src/data/beans.json](src/data/beans.json). The fastest way to add one:

```bash
npm run new:bean
```

The interactive scaffolder prompts for every field, validates flavor-note IDs against [src/data/flavor-notes.json](src/data/flavor-notes.json), refuses duplicate slugs, and appends the new bean. After it finishes, you can either edit `beans.json` to add brewing recommendations by hand or run `npm run expand:brewing` to algorithmically fill the remaining methods.

To add a bean manually:

1. Pick a unique `id` (kebab-case, e.g. `ethiopian-guji`) and `slug`.
2. Fill in origin fields: `country`, `countryCode` (ISO-2), `region`, `coordinates: [lng, lat]`, `altitudeMasl: [min, max]`.
3. Fill in the 6-axis `flavorProfile` (1–10 each), `flavorNotes` (must be IDs from [src/data/flavor-notes.json](src/data/flavor-notes.json)), `varieties`, `processing`, `roastRecommendation`, `harvestMonths`.
4. Add at least one entry to `brewingRecommendations`. Run `npm run expand:brewing` to algorithmically fill the remaining methods.
5. Add a Traditional-Chinese overlay for the new bean, keyed by its `id`, in [src/data/i18n/zh-TW/beans.json](src/data/i18n/zh-TW/beans.json) (`name`, `region`, `varieties`, `description`, `funFact`, and `tastingNotes` keyed by `methodId`), and make sure its `countryCode` exists in [src/data/i18n/countries.json](src/data/i18n/countries.json).
6. Run `npm run validate:data` — Zod will catch any missing or malformed fields, the cross-check will flag unknown flavor-note IDs, method IDs, or related-bean IDs, and the i18n check will flag any missing `zh-TW` overlay entry or country name.

Region polygons live in [public/data/regions.geojson](public/data/regions.geojson) and are fetched client-side for hover highlights.

### UI strings

App-shell copy (nav, filters, buttons, aria labels, metadata, enum labels) lives in the [messages/](messages/) catalogs, one file per locale. Add the key to **both** `en.json` and `zh-TW.json` — `npm run validate:data` fails the build if the two catalogs fall out of key parity.

### Learn articles

Articles are MDX files under [src/content/](src/content/), organized as `<locale>/<category>/<slug>.mdx` (e.g. `en/processing/washed.mdx`, `zh-TW/brewing/v60.mdx`). English is the source language; a missing `zh-TW` file transparently falls back to its English counterpart. Each file needs a frontmatter block:

```mdx
---
title: Washed Processing
description: How wet processing strips the coffee cherry to highlight bright, clean acidity.
summary: Sometimes called wet processing — the fruit is removed before the seed is dried.
readingTimeMinutes: 6
---

## Heading

Markdown body — including GitHub-flavored tables (via `remark-gfm`). You can also drop in registered components:

<BrewTimer totalSeconds={180} bloomSeconds={30} stages={[...]} />

<ProcessDiagram highlight={2} caption="..." steps={[{ label: "Depulp", sub: "remove skin" }]} />

<Callout title="Note">
Body text inside an aside.
</Callout>
```

Slugs are inferred from the filename and enumerated from the English tree (so both locales render every article even before a translation exists). The hub and routes (`/{locale}/learn`, `/{locale}/learn/processing/[slug]`, `/{locale}/learn/brewing/[slug]`) pick up new files automatically — no registry update needed. Keep component props (`totalSeconds`, `stages`, `highlight`, …) identical between an article and its translation; only translate the prose, headings, tables, and the components' `label`/`note`/`caption` text. The articles render through a shared `mdxRenderOptions` (see [src/lib/mdx.ts](src/lib/mdx.ts)) that enables `remark-gfm` and JSX-expression props — keep authored content trusted, since it is rendered with `blockJS` disabled.

## Deployment

The project deploys to Vercel with no configuration beyond environment variables:

1. Import the GitHub repo into Vercel.
2. Add the `NEXT_PUBLIC_MAPBOX_*` env vars (and optionally `NEXT_PUBLIC_SITE_URL` for absolute OG/share URLs) across Production/Preview/Development.
3. Deploy. The build runs `npm run validate:data && next build`.
4. In your Mapbox account, restrict the token to your Vercel domains + `localhost:3000` to prevent scraping.
5. *(Optional)* To turn on accounts, favorites sync, and brew notes, add the **Backend** env vars from [Accounts & backend](#accounts--backend-optional), set your OAuth callback URLs to the deployed domain, and run `npm run db:migrate` once against the database to create the tables.

## License

Released under the [MIT License](LICENSE).
