# BeanMap

An interactive world map of specialty coffee — origins, flavor profiles, brewing recommendations, and an interactive flavor wheel tailored to each bean.

**Status:** *Still Under Development* — Phases 1 & 2 complete; Phase 3 substantially complete. 30 bean profiles with full SCA flavor-note tagging, custom Mapbox styles, SSR bean pages, responsive panel with a draggable mobile bottom sheet, dark/light mode, faceted filters, ⌘K search, brewing recommendation cards with dose calculator + interactive brew timer, /beans browser with grid/table toggle, Euclidean similar-beans, side-by-side bean comparison, D3 flavor wheel with category/subcategory/note filtering, an MDX-powered Learn section, and shareable URLs.

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Map:** [react-map-gl](https://visgl.github.io/react-map-gl/) + [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (globe projection, clustering, custom [Mapbox Studio](https://studio.mapbox.com/) styles)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (on top of [Base UI](https://base-ui.com/)) + custom coffee color palette
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **URL state:** [`nuqs`](https://nuqs.47ng.com/) — type-safe URL search params, shallow routing
- **Search:** [Fuse.js](https://www.fusejs.io/) (weighted, fuzzy)
- **Data viz:** [d3-hierarchy](https://github.com/d3/d3-hierarchy) + [d3-shape](https://github.com/d3/d3-shape) (sunburst flavor wheel); pure SVG everywhere else
- **Gestures:** [`@use-gesture/react`](https://use-gesture.netlify.app/) + [`@react-spring/web`](https://www.react-spring.dev/) (draggable mobile bottom sheet)
- **Content:** [`next-mdx-remote`](https://github.com/hashicorp/next-mdx-remote) (RSC) + [`gray-matter`](https://github.com/jonschlinkert/gray-matter) for the Learn section
- **Data:** JSON seed files validated with [Zod](https://zod.dev/) at build time
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes) (Mapbox style swaps on toggle)
- **Deploy:** [Vercel](https://vercel.com/)

## Feature highlights

- **Interactive map** — Mapbox globe with clustered bean markers, on-hover region highlights. Click a marker to fly to the origin and open its profile.
- **Bean profiles** — Each bean carries a 6-axis flavor profile (acidity, body, sweetness, bitterness, complexity, fruitiness), tagged tasting notes, varieties, processing, harvest months, and an SSR detail page. A similar-beans section uses Euclidean distance over the flavor profile to surface related origins from other countries.
- **Brewing recommendations** — Per-bean cards sorted by affinity score with a "Best Match" highlight. Open any card for a full recipe — grind-scale visualization, water temperature with °C/°F toggle, ratio, pour schedule, equipment list, and an embedded dose calculator that scales by cup count and persists the user's preferred cup size.
- **Interactive brew timer** — Drift-free `requestAnimationFrame` timer with circular progress ring, automatic stage advancement, opt-in Web Audio API beep on stage transitions, `Space` to start/pause, and `prefers-reduced-motion` support. Lives inside the brew detail modal and is exposed as `<BrewTimer />` to MDX articles.
- **SCA flavor wheel** — D3-driven sunburst at [/explore/flavors](http://localhost:3000/explore/flavors) and as a toggleable overlay on the map. Click any segment — category, subcategory, or specific note — to filter beans across the whole app. Includes a screen-reader-only data table and is lazy-loaded so D3 stays out of the initial bundle.
- **Bean comparison** — Add up to three beans to the comparison tray, then open the side-by-side view with overlaid radar charts, a parameter table, and a "best for [method]" highlight. Shareable via `/compare?beans=slug1,slug2,slug3`.
- **Insights** — `/explore/insights` shows aggregate visualizations across the (filtered) catalog: an altitude bar chart with green→brown gradient sorted by midpoint elevation, and a Gantt-style harvest calendar that highlights the current month.
- **Learn section** — MDX-rendered articles at `/learn` for processing methods and brewing guides. Articles can embed `<BrewTimer />` and `<Callout>` components. The pipeline ships with one stub per category (washed processing, V60); the remaining 11 articles are scaffolded as TODOs.
- **Mobile** — Bean panel becomes a draggable bottom sheet with three snap points (peek, half, full), flick-to-close, and a dimmed backdrop. Filters open as a bottom sheet too.
- **Search** — ⌘K opens a fuzzy search across name, country, region, and flavor notes. Recent searches persist in `localStorage`.
- **SCA flavor-notes hierarchy** — 9 categories / 29 subcategories / 84 specific notes in [src/data/flavor-notes.json](src/data/flavor-notes.json), cross-validated against every bean at build time.
- **Shareable URLs** — `nuqs` syncs selected bean, map viewport, all filters (region, processing, roast, altitude, flavor notes) into the URL with shallow routing.

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

All three are inlined into the client bundle at build time — changing them requires a full rebuild.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Run Zod validation, then production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run validate:data` | Validate [src/data/](src/data/) against Zod schemas + cross-check flavor-note IDs, method IDs, and related-bean IDs |
| `npm run expand:brewing` | Regenerate missing brewing recommendations via affinity weights |
| `npm run new:bean` | Interactive scaffolder that prompts for every field and appends a new bean profile to `beans.json` |

## Project structure

```
bean-map/
├── src/
│   ├── app/        # Next.js App Router
│   │   ├── bean/[slug]/       # SSR bean detail page (generateStaticParams)
│   │   ├── beans/             # /beans grid + table browser
│   │   ├── compare/           # /compare?beans=slug1,slug2,slug3
│   │   ├── explore/
│   │   │   ├── flavors/            # D3 flavor wheel + matched beans list
│   │   │   └── insights/           # Altitude chart + harvest calendar
│   │   ├── learn/
│   │   │   ├── page.tsx            # Hub listing processing + brewing articles
│   │   │   ├── processing/[slug]/  # MDX article renderer
│   │   │   └── brewing/[slug]/     # MDX article renderer
│   │   ├── layout.tsx         # Root layout — fonts, ThemeProvider, NuqsAdapter, TopNav
│   │   ├── page.tsx           # Home (map view)
│   │   └── globals.css        # Tailwind v4 theme + coffee palette
│   │
│   ├── components/
│   │   ├── map/               # CoffeeMap, MapView, RegionHighlight, FlavorWheelOverlay
│   │   ├── bean/              # BeanPanel, BeansBrowser
│   │   ├── filter/            # FilterPanel, FlavorSliders, ActiveFilters
│   │   ├── brewing/           # BrewCard, BrewDetailModal, BrewCalculator, BrewTimer
│   │   ├── compare/           # ComparisonTray, ComparisonView, CompareToggle
│   │   ├── visualization/     # FlavorRadar, FlavorWheel(+Lazy), AltitudeChart, SeasonalChart
│   │   ├── layout/            # TopNav, MobileBottomSheet
│   │   ├── shared/            # ThemeProvider, ThemeToggle, SearchCommand, UrlStateSync
│   │   └── ui/                # shadcn/ui primitives (Button, Dialog, Sheet, Slider, …)
│   │
│   ├── content/    # MDX articles for the Learn section
│   │   ├── processing/        # washed.mdx (+ stubs to come)
│   │   └── brewing/           # v60.mdx (+ stubs to come)
│   │
│   ├── lib/
│   │   ├── data.ts               # Cached bean / method / flavor-notes loaders
│   │   ├── schemas.ts            # Zod schemas mirroring src/types
│   │   ├── search.ts             # Fuse.js index + recent-searches helpers
│   │   ├── similar.ts            # Euclidean distance over flavor profile
│   │   ├── mdx.ts                # Article frontmatter + content loaders (gray-matter)
│   │   ├── mdx-components.tsx    # MDX components map (BrewTimer, Callout, prose styles)
│   │   ├── url-state.ts          # nuqs parsers for filters / viewport / selection
│   │   ├── altitude-color.ts     # Shared color ramp for altitude visualizations
│   │   ├── use-media-query.ts    # SSR-safe matchMedia hook + prefers-reduced-motion helper
│   │   └── utils.ts              # cn(), country flags, formatters, flavor-note label lookup
│   │
│   ├── store/      # Zustand store + filter selectors (includes flavor-note hierarchy match)
│   ├── types/      # TypeScript interfaces
│   └── data/       # beans.json, brewing-methods.json, flavor-notes.json, regions.geojson
│
├── public/
│   └── data/       # regions.geojson (fetched at runtime by the map)
│       └── merge-geojson.py      # Merge per-region GADM extracts → regions.geojson
│
├── scripts/
│   ├── validate-data.ts          # Zod validation + cross-checks — runs before `next build`
│   ├── expand-brewing-recs.mjs   # Generate missing brewing recs by affinity
│   └── new-bean.mjs              # Interactive scaffolder (`npm run new:bean`)
│
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
5. Run `npm run validate:data` — Zod will catch any missing or malformed fields and the cross-check will flag unknown flavor-note IDs, method IDs, or related-bean IDs.

Region polygons live in [public/data/regions.geojson](public/data/regions.geojson) and are fetched client-side for hover highlights.

### Learn articles

Articles are MDX files in [src/content/](src/content/) under `processing/` or `brewing/`. Each file needs a frontmatter block:

```mdx
---
title: Washed Processing
description: How wet processing strips the coffee cherry to highlight bright, clean acidity.
summary: Sometimes called wet processing — the fruit is removed before the seed is dried.
readingTimeMinutes: 6
---

## Heading

Markdown body. You can also drop in registered components:

<BrewTimer totalSeconds={180} bloomSeconds={30} stages={[...]} />

<Callout title="Note">
Body text inside an aside.
</Callout>
```

Slugs are inferred from the filename. The hub and routes (`/learn`, `/learn/processing/[slug]`, `/learn/brewing/[slug]`) pick up new files automatically — no registry update needed.

## Deployment

The project deploys to Vercel with no configuration beyond environment variables:

1. Import the GitHub repo into Vercel.
2. Add the three `NEXT_PUBLIC_MAPBOX_*` env vars across Production/Preview/Development.
3. Deploy. The build runs `npm run validate:data && next build`.
4. In your Mapbox account, restrict the token to your Vercel domains + `localhost:3000` to prevent scraping.

## License

Released under the [MIT License](LICENSE).
