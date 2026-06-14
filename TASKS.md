# BeanMap - Project Tasks

An interactive world map showcasing coffee beans from around the world, their origins, flavor profiles, and recommended brewing methods.

**Tech Stack**: Next.js 14+ (App Router) | TypeScript | react-map-gl + Mapbox GL JS | Tailwind CSS + shadcn/ui | Zustand | Framer Motion | Recharts + D3 | Fuse.js | MDX

---

## Phase 1: Foundation

**Goal**: A working interactive map with clickable bean markers, profile panels, and dark/light mode.

### 1.1 Project Scaffolding
- [x] Initialize Next.js project with `create-next-app` (TypeScript, Tailwind, App Router, `src/` dir)
- [x] Install core dependencies: `react-map-gl`, `mapbox-gl`, `framer-motion`, `zustand`, `lucide-react`, `zod`, `next-themes`
- [x] Initialize shadcn/ui (`npx shadcn-ui@latest init`) and install base components: Sheet, Dialog, Button, Toggle, Slider, Command, NavigationMenu
- [x] Configure Tailwind theme with coffee color palette:
  - `cream: #FAF6F1`, `parchment: #F0E8DC`, `tan: #D4C4A8`
  - `roast-light: #A67C52`, `roast-medium: #6F4E37`, `roast-dark: #3B2314`, `espresso: #1A0F09`
  - `cherry-red: #C1440E`, `leaf-green: #4A7C59`, `water-blue: #5B8FA8`
- [x] Set up fonts via `next/font/google`: DM Serif Display (headings), Inter (body), JetBrains Mono (parameters)
- [x] Configure ESLint + Prettier with `prettier-plugin-tailwindcss`
- [x] Create project directory structure:
  ```
  src/
    app/          -- pages and layouts
    components/   -- map/, bean/, brewing/, filter/, compare/, visualization/, shared/, layout/
    lib/          -- schemas, utils, data loading, map helpers, search config
    store/        -- Zustand store
    types/        -- TypeScript interfaces
    content/      -- MDX articles (Phase 3)
    data/         -- JSON seed data + GeoJSON
  public/
    images/       -- beans/, methods/, icons/
  ```

### 1.2 Mapbox Setup
- [x] Create Mapbox account and generate access token
- [x] Store token in `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`
- [x] Design custom light map style in Mapbox Studio (warm terrain tones, desaturated non-bean-belt regions)
- [x] Design custom dark map style (espresso-toned background, reduced saturation accents)
- [x] Add `.env.local` to `.gitignore`, create `.env.example` with placeholder

### 1.3 Seed Data - Coffee Beans (Batch 1)
- [x] Create `/data/beans.json` with 30 well-researched bean profiles:
  - **Africa**: Ethiopia (Yirgacheffe, Sidamo, Guji), Kenya (Nyeri, Kirinyaga), Rwanda (Nyamasheke), Tanzania (Kilimanjaro)
  - **Central America**: Guatemala (Antigua, Huehuetenango), Costa Rica (Tarrazu), Panama (Boquete/Gesha), Honduras (Copan)
  - **South America**: Colombia (Huila, Narino, Tolima), Brazil (Cerrado, Sul de Minas), Peru (Cajamarca)
  - **Asia-Pacific**: Indonesia (Sumatra Mandheling, Java), Yemen (Haraz), India (Malabar)
- [x] Each bean includes: id, slug, name, country, countryCode, region, coordinates [lng, lat], altitude range, varieties, processing method, roast recommendation, 6-axis flavor profile (1-10), flavor notes array, harvest months, description, related bean IDs
- [x] Validate all coordinates are accurate for the specific growing regions
- [x] Cross-reference flavor profiles against SCA cupping standards and specialty roaster notes

### 1.4 Seed Data - Brewing Methods & Recommendations
- [x] Create `/data/brewing-methods.json` with 8 methods:
  - Pour-Over V60, Chemex, Kalita Wave, Espresso, French Press, AeroPress, Cold Brew, Moka Pot
  - Each: id, name, category, description, icon name, equipment list, default parameters
- [x] Add `brewingRecommendations` array to each bean in `beans.json`:
  - Per method: grind size + microns, water temp (C), coffee:water ratio, bloom time, brew time, pour stages (pour-over), difficulty (1-5), affinity score (1-10), tasting notes
  - Tailor recommendations to each bean's characteristics (e.g., light-roast Ethiopian gets higher V60 affinity, lower French Press)

### 1.5 Seed Data - Regions GeoJSON
- [x] Create `/data/regions.geojson` with simplified polygons for the 30 origin regions
- [x] Source boundaries from Natural Earth / GADM datasets
- [x] Simplify polygons with mapshaper (tolerance ~0.01) to keep total file under 500KB
- [x] Include properties: regionId, country, name, altitudeRange

### 1.6 TypeScript Types & Zod Schemas
- [x] Define interfaces in `/types/index.ts`:
  - `CoffeeBean`, `BrewRecommendation`, `BrewingMethod`, `CoffeeRegion`, `FlavorNote`, `PourStage`
  - Type literals: `ProcessingMethod`, `RoastLevel`, `GrindSize`
- [x] Create Zod schemas in `/lib/schemas.ts` mirroring all interfaces
- [x] Write build-time validation script that parses all JSON data through Zod on `next build`
- [x] Create `/lib/data.ts` with typed data loading functions: `getBeans()`, `getBeanBySlug()`, `getBrewingMethods()`, `getRegions()`

### 1.7 Zustand Store
- [x] Create `/store/index.ts` with slices:
  - `mapState`: viewport (lat, lng, zoom, bearing, pitch), selectedBeanId
  - `filterState`: regions, processingMethods, altitudeRange, roastLevels, flavorRanges (acidity, body, sweetness, bitterness min/max)
  - `comparisonState`: selectedBeanIds (max 3), isComparisonOpen
  - `uiState`: theme, isBeanPanelOpen, isFilterPanelOpen
- [x] Add actions: `selectBean()`, `clearSelection()`, `toggleFilter()`, `resetFilters()`, `addToComparison()`, `removeFromComparison()`
- [x] Add computed selectors: `filteredBeans()` that applies all active filters to the bean dataset

### 1.8 Interactive Map Component
- [x] Build `src/components/map/CoffeeMap.tsx` (Client Component)
- [x] Render full-bleed map with `react-map-gl` Map component
- [x] Enable globe projection at low zoom levels
- [x] Add GeoJSON Source with bean coordinates, enable clustering (`cluster: true`, `clusterMaxZoom: 14`, `clusterRadius: 50`)
- [x] Render cluster Layer (circle with count label) and individual marker Layer (custom coffee bean icon)
- [x] Handle marker click: `flyTo` the bean coordinates (zoom 10), set `selectedBeanId` in store, open bean panel
- [x] Handle cluster click: `flyTo` cluster bounds to expand it
- [x] Sync map viewport to Zustand store for URL state (Phase 2)
- [x] Add atmosphere/fog for globe view aesthetic
- [x] Handle loading state with skeleton placeholder

### 1.9 Region Polygon Highlight
- [x] Build `src/components/map/RegionHighlight.tsx`
- [x] Add regions GeoJSON as a map Source
- [x] On marker hover, set a `hoveredRegionId` filter on a fill Layer (semi-transparent warm overlay)
- [x] Fade in/out with paint-transition properties
- [x] Clear highlight on mouse leave

### 1.10 Bean Profile Panel
- [x] Build `src/components/bean/BeanPanel.tsx` using shadcn Sheet component
- [x] Layout sections:
  - **Header**: Country flag emoji, bean name, region, altitude range
  - **Flavor Profile**: Display 6-axis values as labeled bars (radar chart comes in Phase 3)
  - **Tasting Notes**: Chip/badge list of flavor notes
  - **Details**: Varieties, processing method, roast recommendation, harvest season (month names)
  - **Brewing**: Preview cards for top 3 recommended methods (by affinity score)
  - **Similar Beans**: 2-3 related bean cards
  - **Description**: Short overview paragraph
- [x] Wire up: `selectedBeanId` from store -> fetch bean data -> render panel
- [x] Close panel: clear selection, panel slides out
- [x] Add "View Full Profile" link to `/bean/[slug]` page

### 1.11 Top Navigation
- [x] Build `src/components/layout/TopNav.tsx`
- [x] Fixed position, 56px height, backdrop blur (`backdrop-blur-md`)
- [x] Left: BeanMap logo (text + coffee bean icon from Lucide)
- [x] Center: Search button placeholder (Cmd+K hint) -- functional search in Phase 2
- [x] Right: "Explore" link (map), "Learn" link (placeholder), theme toggle button
- [x] Mobile: Hamburger menu for nav links, search icon

### 1.12 Dark/Light Mode
- [x] Install and configure `next-themes` with ThemeProvider in root layout
- [x] Build `src/components/shared/ThemeToggle.tsx` (Sun/Moon icon toggle)
- [x] System preference detection with manual override
- [x] Map: switch Mapbox style ID between light and dark variants on theme change
- [x] All components use Tailwind `dark:` variants
- [x] Persist preference in localStorage

### 1.13 Responsive Layout
- [x] Mobile (< 640px): Map fills viewport, bean panel opens as bottom sheet (shadcn Sheet `side="bottom"`)
- [x] Tablet (640-1024px): Bean panel as right sheet (50% width)
- [x] Desktop (> 1024px): Bean panel as right sheet (420px fixed width)
- [x] Ensure map controls (zoom +/-, compass) don't overlap with panels
- [x] Test touch interactions on map (pinch zoom, two-finger pan)

### 1.14 Bean Detail Page (SSR)
- [x] Create `src/app/bean/[slug]/page.tsx` as a Server Component
- [x] Fetch bean data by slug using `getBeanBySlug()`
- [x] Full-page bean profile with all details (expanded version of panel)
- [x] Generate `metadata` with Open Graph tags: title, description, image (static placeholder for now)
- [x] `generateStaticParams()` to pre-render all bean pages at build time
- [x] 404 handling for invalid slugs
- [x] "View on Map" button that links back to `/?bean=[slug]`

### Phase 1 Verification
- [x] `npm run build` succeeds with no errors
- [x] Map loads with 30 markers and clustering at low zoom
- [x] Clicking a marker flies to it and opens the bean panel with correct data
- [x] Region highlights on marker hover
- [x] Dark/light mode toggles map style and all UI
- [x] Responsive: mobile bottom sheet, desktop side panel
- [x] Bean detail page renders at `/bean/ethiopian-yirgacheffe` with correct OG tags
- [x] Deploy to Vercel and verify production build

---

## Phase 2: Core Features

**Goal**: Full filtering, search, brewing recommendations with calculator, expanded data, and URL state sync.

### 2.1 Filter Panel
- [x] Build `src/components/filter/FilterPanel.tsx`
- [x] Desktop: Collapsible left sidebar (280px), toggle button on map edge
- [x] Mobile: Full-screen bottom sheet triggered by filter icon button
- [x] Sections:
  - **Region**: Multi-select checkboxes (Africa, Central America, South America, Asia-Pacific) with country sub-groups
  - **Processing Method**: Checkboxes (Washed, Natural, Honey, Anaerobic, Wet-Hulled)
  - **Roast Level**: Toggle chips (Light, Medium-Light, Medium, Medium-Dark, Dark)
  - **Altitude**: Dual-handle range slider (500-2500 masl)
- [x] "Reset Filters" button, active filter count badge on toggle button
- [x] Wire all values to Zustand `filterState`

### 2.2 Flavor Profile Sliders
- [x] Build `src/components/filter/FlavorSliders.tsx`
- [x] Dual-handle range sliders for: Acidity, Body, Sweetness, Bitterness (range 1-10)
- [x] Use shadcn Slider component (customized for dual handles)
- [x] Real-time preview: show count of matching beans as sliders adjust
- [x] Add to FilterPanel as a collapsible "Flavor Profile" section

### 2.3 Real-Time Map Filtering
- [x] When `filterState` changes, compute `filteredBeans` via Zustand selector
- [x] Update GeoJSON source data: set `filtered: false` property on non-matching beans
- [x] Map paint expression: matching markers full opacity, non-matching at 0.15 opacity
- [x] Animate opacity transition (200ms ease)
- [x] Update cluster counts to only include matching beans
- [x] Show "X of Y beans" counter on the filter panel

### 2.4 Search (Cmd+K)
- [x] Build `src/components/shared/SearchCommand.tsx` using shadcn Command (cmdk)
- [x] Configure Fuse.js index in `/lib/search.ts`:
  - Search fields: name, country, region, flavorNotes (weighted: name > region > flavorNotes)
  - Threshold: 0.3 for fuzzy matching
- [x] Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows) opens dialog
- [x] Results show: bean name, country flag, region, top 2 flavor notes
- [x] Selecting a result: close dialog, fly to bean on map, open bean panel
- [x] "No results" state with suggestion to adjust search
- [x] Recent searches stored in localStorage (last 5)

### 2.5 Brewing Recommendation Cards
- [x] Build `src/components/brewing/BrewCard.tsx`
- [x] Display: method icon, method name, affinity score (bar or dots), grind size, water temp, ratio, brew time, difficulty stars
- [x] Horizontal scrolling row in the bean panel (snap scrolling on mobile)
- [x] Cards sorted by affinity score (highest first)
- [x] Visual indicator for "Best Match" on highest affinity method
- [x] Click card to open brew detail modal

### 2.6 Brew Detail Modal
- [x] Build `src/components/brewing/BrewDetailModal.tsx` using shadcn Dialog
- [x] Full parameter display:
  - Grind size with visual particle-size reference (illustrated scale from extra-fine to extra-coarse)
  - Water temperature (C and F toggle)
  - Coffee:water ratio with gram amounts
  - Bloom time + total brew time
  - Pour stages with water amounts and instructions (pour-over methods)
  - Equipment list
  - Difficulty rating with description
- [x] "Why this works" explanation paragraph
- [x] Link to full brewing guide (Phase 3)
- [x] Integrated dose calculator (see 2.7)

### 2.7 Dose Calculator
- [x] Build `src/components/brewing/BrewCalculator.tsx`
- [x] Input: desired output (ml or cups, with cup size selector: 200ml, 250ml, 300ml, 350ml)
- [x] Auto-calculates: coffee grams, water ml, maintaining the bean-specific ratio
- [x] Persist preferred cup size in localStorage
- [x] Clean number display (round to 0.1g for coffee, whole ml for water)
- [x] Embedded within BrewDetailModal and also usable standalone

### 2.8 Seed Data - Beans (Batch 2)
- [ ] Expand `/data/beans.json` to 150-200 profiles covering:
  - **Colombia**: Cauca, Santander, Sierra Nevada, Antioquia, Quindio
  - **Brazil**: Mogiana, Bahia, Espirito Santo, Chapada Diamantina
  - **East Africa**: Burundi (Kayanza), Tanzania (Mbeya), DRC (Kivu), Uganda (Mt. Elgon), Malawi (Misuku)
  - **Central America**: Honduras (Marcala, Comayagua), El Salvador (Apaneca), Nicaragua (Jinotega, Matagalpa), Mexico (Chiapas, Oaxaca)
  - **Asia**: Myanmar (Shan State), Papua New Guinea (Eastern Highlands), China (Yunnan), Vietnam (Da Lat specialty)
  - **Islands**: Hawaii (Kona), Jamaica (Blue Mountain), Reunion (Bourbon origin)
- [ ] Add brewing recommendations for all new beans
- [ ] Ensure no duplicate coordinates (offset overlapping markers slightly)

### 2.9 Flavor Notes Data
- [x] Create `/data/flavor-notes.json` following SCA flavor wheel hierarchy:
  - ~15 top-level categories (Fruity, Floral, Sweet, Nutty/Cocoa, Spices, Roasted, Cereal, etc.)
  - ~40 subcategories
  - ~100 specific notes with hex color for wheel visualization
- [x] Tag each bean in `beans.json` with specific flavor note IDs (replacing plain-text notes)
- [x] Update `FlavorNote` type and Zod schema

### 2.10 Bean List Page
- [x] Create `src/app/beans/page.tsx`
- [x] Grid view (default): Cards showing bean name, country, key flavor notes, altitude, processing
- [x] Table view (toggle): Sortable columns for all key attributes
- [x] Reuse filter components from the map view
- [x] Each card/row links to bean detail page AND has "Show on Map" button
- [x] Pagination or infinite scroll for 150+ beans

### 2.11 Similar Beans Section
- [x] Add "Similar Beans" section to BeanPanel and bean detail page
- [x] Algorithm: compute Euclidean distance across the 6-axis flavor profile
- [x] Show 3 closest beans (excluding same country to encourage exploration)
- [x] Display as mini cards with name, country, top 2 flavor notes
- [x] Click navigates to that bean on the map

### 2.12 URL State Sync
- [x] Install `nuqs` for type-safe URL search parameter management
- [x] Sync to URL: selected bean (`?bean=slug`), map viewport (`lat`, `lng`, `zoom`), active filters (`region`, `processing`, `altitude`, `roast`)
- [x] On page load, restore state from URL params
- [x] Shareable URLs: `bean-map.vercel.app/?bean=ethiopian-yirgacheffe&region=africa&acidity=7-10`
- [x] Update URL on state change without full page navigation (shallow routing)

### Phase 2 Verification
- [x] Filters narrow visible markers in real-time with opacity fade
- [x] All filter types work: region, processing, altitude range, roast, flavor sliders
- [x] Cmd+K search finds beans by name, region, and flavor notes
- [x] Brew cards display correctly sorted by affinity in bean panel
- [x] Brew detail modal shows all parameters with correct C/F toggle
- [x] Dose calculator scales correctly for different cup sizes
- [x] Bean list page renders 150+ beans with grid/table toggle
- [x] URL state persists: copy URL, open in new tab, same view loads
- [x] Mobile: all features accessible via bottom sheets and modals

---

## Phase 3: Enhanced UX

**Goal**: Rich data visualizations, bean comparison, polished animations, and educational content.

### 3.1 Flavor Radar Chart
- [x] Build `src/components/visualization/FlavorRadar.tsx` (pure SVG, no Recharts dep)
- [x] 6 axes: Acidity, Body, Sweetness, Bitterness, Complexity, Fruitiness
- [x] Filled polygon with semi-transparent brand color fill
- [x] Animated draw-on-enter (CSS keyframes, respects prefers-reduced-motion)
- [x] Replace the text-based flavor display in BeanPanel with this chart
- [x] Support overlay mode: render 2-3 polygons for comparison (different colors)

### 3.2 Interactive Flavor Wheel
- [x] Build `src/components/visualization/FlavorWheel.tsx`
- [x] D3 sunburst layout using `d3-hierarchy` and `d3-shape`
- [x] 3 concentric rings: category -> subcategory -> specific note
- [x] Color-coded segments matching the SCA wheel colors
- [x] Hover: highlight segment + show tooltip with note name and bean count
- [x] Click a segment: filter beans on map to only those with that flavor note
- [x] Smooth arc transitions on hover/click
- [x] Accessible: include screen-reader-only table listing all notes
- [x] Lazy-loaded (dynamic import) to avoid D3 in initial bundle
- [x] Place on map view as a toggleable overlay or on a dedicated `/explore/flavors` page

### 3.3 Altitude Chart
- [x] Build `src/components/visualization/AltitudeChart.tsx` (pure SVG/CSS bars)
- [x] Shows altitude ranges for currently visible/filtered beans
- [x] Sorted highest to lowest (by midpoint)
- [x] Color gradient from leaf-green (low) to roast-dark (high)
- [x] Click a bar to select that bean on the map
- [x] Lives on `/explore/insights` page

### 3.4 Harvest Calendar
- [x] Build `src/components/visualization/SeasonalChart.tsx`
- [x] Gantt-style grid: months as columns (Jan-Dec), beans as rows
- [x] Colored cells for harvest months, highlight current month (cherry-red ring)
- [x] Group rows by country for easy scanning
- [x] Click a row to navigate to that bean
- [x] Useful for finding "what's in season now"

### 3.5 Comparison Feature
- [x] Build `src/components/compare/ComparisonTray.tsx`
  - Sticky bottom bar that collapses to a peek state, slides up from bottom
  - Shows 1-3 selected bean mini cards with X to remove
  - "Share link" button -> `/compare?beans=...`
  - "Compare" button opens full comparison view in a Dialog
- [x] Build `src/components/compare/ComparisonView.tsx`
  - Side-by-side bean cards (2-3 columns)
  - Overlaid radar chart (all beans on one chart, different colors)
  - Parameter comparison table: altitude, processing, roast, top flavor notes
  - Brewing recommendation comparison with method picker
  - "Best for [method]" highlight (Trophy icon on highest affinity)
- [x] Add "Compare" toggle button to BeanCard and BeanPanel
- [x] Store comparison state in Zustand, max 3 beans (already wired pre-Phase-3)

### 3.6 Comparison Page
- [x] Create `src/app/compare/page.tsx`
- [x] Read bean slugs from URL params: `/compare?beans=slug1,slug2,slug3`
- [x] Render full ComparisonView as a standalone page
- [x] Shareable URL for bean comparisons (dynamic metadata: "X vs Y · Compare on BeanMap")
- [x] Empty state with CTA to explore beans

### 3.7 Framer Motion Polish
- [x] BeanPanel: `AnimatePresence` slide-in from right (desktop) / up (mobile via bottom sheet), staggered children entrance
- [x] Bean cards in lists: staggered fade-up on scroll into view (`whileInView`, row-capped delay)
- [x] Comparison tray: `layout` + `AnimatePresence` — cards fly in/out and reflow as beans are added/removed
- [x] Filter chips: entrance/exit animation when toggled (scale+fade `AnimatePresence`)
- [x] Hero image in bean panel: subtle parallax on scroll (per-bean gradient generated from the bean's flavor profile via `src/lib/flavor-gradient.ts` — dominant flavor-note category colors drive the hue, numeric profile drives the geometry; no external imagery)
- [x] Page transitions: fade between map and list views (`app/template.tsx`)
- [x] Loading skeletons: shimmer animation on data loading states (`.skeleton`, `Skeleton` component, map + `/beans` loading)
- [x] `prefers-reduced-motion`: disable all animations, instant transitions (global rule in globals.css; chart animations gated on `motion-safe:`)

### 3.8 Educational Content - Processing Methods
- [x] Set up MDX rendering pipeline with `next-mdx-remote`
- [x] Create `src/app/learn/page.tsx` (Learn hub with article grid)
- [x] Create `src/app/learn/processing/[slug]/page.tsx` (article renderer)
- [x] Write 5 MDX articles in `/content/processing/`:
  - [x] `washed.mdx` - Washed/wet processing
  - [x] `natural.mdx` - Natural/dry processing
  - [x] `honey.mdx` - Honey processing (yellow, red, black)
  - [x] `anaerobic.mdx` - Anaerobic fermentation
  - [x] `wet-hulled.mdx` - Wet-hulled (Giling Basah)
- [x] Each article: overview, step-by-step process, impact on flavor, origin regions that use it, embedded SVG diagrams
- [x] Link from bean profiles to relevant processing article

### 3.9 Educational Content - Brewing Guides
- [x] Create `src/app/learn/brewing/[slug]/page.tsx` (article renderer)
- [x] Write 8 MDX guides in `/content/brewing/`:
  - [x] `v60.mdx`
  - [x] `chemex.mdx`, `kalita-wave.mdx`, `french-press.mdx`
  - [x] `aeropress.mdx`, `espresso.mdx`, `cold-brew.mdx`, `moka-pot.mdx`
- [x] Each guide: equipment list, step-by-step instructions with timing, common mistakes, tips for different beans
- [x] Embed interactive `BrewTimer` component within guides
- [x] Link from brew detail modal to relevant guide

### 3.10 Interactive Brew Timer
- [x] Build `src/components/brewing/BrewTimer.tsx`
- [x] Countdown/count-up timer with start/pause/reset
- [x] Pour stage alerts for pour-over methods (visual + optional sound)
- [x] Configurable stages based on the brewing method's pour schedule
- [x] Circular progress indicator with elapsed/remaining time
- [x] `requestAnimationFrame` for smooth rendering
- [x] Embeddable in MDX articles and brew detail modal

### 3.11 Altitude Heatmap Layer
- [ ] Add toggleable terrain/altitude layer to the map
- [ ] Use Mapbox terrain-rgb raster tiles
- [ ] Style with color ramp showing elevation gradient (greens -> browns -> whites)
- [ ] Only display within coffee-growing regions (mask with bean-belt bounds)
- [ ] Toggle button on map controls
- [ ] Opacity slider for blending with base map

### 3.12 Mobile Bottom Sheet
- [x] Build `src/components/layout/MobileBottomSheet.tsx`
- [x] Replace simple mobile Sheet with a draggable bottom sheet
- [x] Three snap points: peek (25% - shows bean name + key stats), half (50%), full (90%)
- [x] Gesture-based: drag handle, flick to expand/collapse
- [x] Use `@use-gesture/react` for touch handling
- [x] Smooth spring animation between snap points
- [x] Backdrop: map dims slightly when sheet is at half or full

### Phase 3 Verification
- [ ] Radar chart renders correctly for each bean with animated entrance
- [ ] Flavor wheel displays full SCA hierarchy, clicking filters beans on map
- [ ] Altitude chart and harvest calendar show correct data for filtered beans
- [ ] Comparison tray: add up to 3 beans, overlaid radar chart renders, parameter table is accurate
- [ ] Comparison URL is shareable and loads correctly
- [ ] Animations are smooth (60fps), respect reduced-motion preference
- [ ] All 13 MDX articles render with embedded components (timer, diagrams)
- [ ] Brew timer counts down accurately with pour stage alerts
- [ ] Mobile bottom sheet drags smoothly between snap points

---

## Phase 4: Social & Community

**Goal**: Sharing capabilities, persistent favorites, optional authentication, and community features.

### 4.1 Share Functionality
- [ ] Build `src/components/shared/ShareButton.tsx`
- [ ] Mobile: Web Share API (`navigator.share()`) with title, text, URL
- [ ] Desktop fallback: Copy-to-clipboard with "Copied!" toast notification
- [ ] Add ShareButton to: BeanPanel, bean detail page, ComparisonView, BrewDetailModal
- [ ] Share text format: "Check out [Bean Name] from [Region] on BeanMap! [URL]"

### 4.2 OG Image Generation
- [ ] Create `src/app/api/og/route.tsx` using `@vercel/og` (Satori)
- [ ] Dynamic OG images for bean pages: bean name, origin, radar chart preview, key flavor notes, warm coffee-themed background
- [ ] Dynamic OG images for comparison pages: 2-3 bean names, "Compare on BeanMap"
- [ ] Update all `metadata` exports to use dynamic OG image URLs
- [ ] Test with social media debuggers (Twitter Card Validator, Facebook Sharing Debugger)

### 4.3 Shareable Brew Recipe Cards
- [ ] Build `src/components/brewing/ShareRecipeCard.tsx`
- [ ] "Share Recipe" button in BrewDetailModal
- [ ] Generate a visually appealing card showing: bean name, brewing method, key parameters (grind, temp, ratio, time)
- [ ] Option 1: Generate as OG-powered link (dynamic OG image at `/api/og/recipe?bean=X&method=Y`)
- [ ] Option 2: Generate as downloadable PNG using `html-to-image` library
- [ ] Card design: clean layout with coffee color palette, BeanMap branding

### 4.4 Local Favorites
- [ ] Build `src/components/shared/FavoriteButton.tsx` (heart icon toggle)
- [ ] Zustand `persist` middleware to save favorited bean IDs in localStorage
- [ ] Add FavoriteButton to: BeanPanel, BeanCard, bean detail page
- [ ] Create `src/app/favorites/page.tsx`:
  - Grid of favorited bean cards
  - Sort by: date added, name, region
  - Empty state with CTA to explore
  - Export favorites list (optional: JSON download)

### 4.5 Database Setup
- [ ] Provision Neon Postgres database (free tier)
- [ ] Install Drizzle ORM + `drizzle-kit`
- [ ] Define schemas in `/drizzle/schema.ts`:
  - `users` table: id, email, name, image, provider, createdAt
  - `favorites` table: id, userId, beanSlug, createdAt
  - `brewNotes` table: id, userId, beanSlug, methodId, note, rating, createdAt, updatedAt
- [ ] Generate and run initial migration
- [ ] Create `/lib/db.ts` with Drizzle client configuration
- [ ] Add database URL to `.env.local`

### 4.6 Authentication
- [ ] Install NextAuth.js v5 (`next-auth@beta`)
- [ ] Configure providers: Google OAuth, GitHub OAuth
- [ ] Set up JWT session strategy (no database sessions needed)
- [ ] Create auth API route at `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Build sign-in/sign-out UI components
- [ ] Add user avatar/sign-in button to TopNav
- [ ] Create user record in Postgres on first login
- [ ] Protect authenticated routes with middleware

### 4.7 Synced Favorites
- [ ] Create API routes:
  - `GET /api/favorites` - list user's favorites
  - `POST /api/favorites` - add a favorite
  - `DELETE /api/favorites/[beanSlug]` - remove a favorite
- [ ] On login: merge localStorage favorites with server favorites (union, no duplicates)
- [ ] After merge: clear localStorage favorites, use server as source of truth
- [ ] FavoriteButton: check auth state, use local or server accordingly
- [ ] Optimistic updates with rollback on error

### 4.8 Personal Brew Notes
- [ ] Build `src/components/brewing/BrewNoteForm.tsx`
- [ ] Authenticated users can add notes to a bean:
  - Brewing method used
  - Free-text tasting notes
  - Rating (1-5 stars)
  - Date brewed
- [ ] Create API routes for CRUD operations on brew notes
- [ ] Display as a timeline on the bean profile (private, only visible to the author)
- [ ] Build `src/app/notes/page.tsx` - personal brewing journal listing all notes

### 4.9 Discover Feed
- [ ] Create `src/app/discover/page.tsx`
- [ ] Sections:
  - **In Season Now**: Beans currently in harvest (based on current month)
  - **Popular This Week**: Most favorited beans (requires tracking, or curate manually)
  - **Editor's Picks**: Curated rotating selection (stored in JSON or CMS)
  - **New Additions**: Recently added beans
- [ ] Responsive grid layout with section headers
- [ ] Link to bean profiles and map view

### Phase 4 Verification
- [ ] Share button works on mobile (Web Share API) and desktop (clipboard)
- [ ] OG images generate correctly for bean pages and comparisons
- [ ] Brew recipe card generates and downloads as PNG
- [ ] Favorites persist in localStorage for unauthenticated users
- [ ] Auth flow works: sign in with Google/GitHub, user created in DB
- [ ] Favorites sync: local favorites merge on first login, subsequent favorites save to DB
- [ ] Brew notes: create, read, update, delete all work correctly
- [ ] Discover page shows correct seasonal beans based on current month

---

## Phase 5: Polish & Launch

**Goal**: Performance optimization, SEO hardening, accessibility audit, and production readiness.

### 5.1 Performance Audit
- [ ] Run Lighthouse on key pages: home/map, bean detail, bean list, learn articles
- [ ] Target scores: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+
- [ ] Measure Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Identify and address largest contentful paint bottleneck (likely Mapbox JS)
- [ ] Profile React rendering with React DevTools Profiler

### 5.2 Bundle Optimization
- [ ] Install `@next/bundle-analyzer`, analyze output
- [ ] Dynamic imports for heavy components:
  - `CoffeeMap` (Mapbox GL JS ~200KB gzipped)
  - `FlavorWheel` (D3 subset)
  - `ComparisonView`
  - `BrewTimer`
- [ ] Tree-shake D3: import only `d3-hierarchy`, `d3-shape`, `d3-scale`, `d3-selection`
- [ ] Verify no full lodash/moment imports (use date-fns, native methods)
- [ ] Target: initial JS bundle < 200KB gzipped

### 5.3 Image Optimization
- [ ] Convert all bean hero images to WebP format, generate AVIF variants
- [ ] Use Next.js `<Image>` component everywhere with:
  - `placeholder="blur"` with generated blur data URLs
  - Responsive `sizes` attribute
  - Lazy loading for below-fold images
- [ ] Compress all images: target < 100KB per hero image
- [ ] Total image budget for initial viewport: < 500KB

### 5.4 Map Performance
- [ ] Measure GeoJSON file sizes, simplify further if > 1MB total
- [ ] Consider Mapbox vector tilesets for region boundaries if client-side GeoJSON is too heavy
- [ ] Implement `useDeferredValue` for filter state to prevent map jank during rapid filter changes
- [ ] Debounce viewport sync to URL (300ms) to avoid excessive history entries
- [ ] Test on low-end devices (throttled CPU/network in DevTools)

### 5.5 SEO
- [ ] Generate dynamic `sitemap.xml` at build time (all bean pages, learn pages, static pages)
- [ ] Create `robots.txt` (allow all, point to sitemap)
- [ ] Add JSON-LD structured data to bean pages (Product or Dataset schema)
- [ ] Unique meta title and description for every page
- [ ] Canonical URLs on all pages
- [ ] Submit to Google Search Console, verify indexing
- [ ] Test with Google Rich Results Test

### 5.6 Accessibility Audit
- [ ] Full keyboard navigation audit: every interactive element reachable and operable via keyboard
- [ ] Screen reader testing with VoiceOver (macOS) and NVDA (Windows)
- [ ] Run `axe-core` automated audit on all pages, fix all violations
- [ ] Map accessibility: provide a hidden bean list as an equivalent non-visual navigation method
- [ ] All images have descriptive `alt` text
- [ ] Radar charts and flavor wheel include screen-reader-only data tables
- [ ] Color contrast: verify all text meets WCAG 2.1 AA (4.5:1 body, 3:1 large)
- [ ] Focus indicators: visible ring on all interactive elements
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Skip-to-content link for keyboard users
- [ ] Aria labels on all icon-only buttons

### 5.7 Error Handling
- [ ] Add React Error Boundaries around: Map component, visualization components, auth-dependent sections
- [ ] Graceful fallback UI for map loading failures (Mapbox token issues, network errors)
- [ ] Custom 404 page for invalid bean slugs and routes
- [ ] Custom 500 page for server errors
- [ ] API route error responses with proper status codes and messages
- [ ] Toast notifications for user-facing errors (favoriting fails, share fails, etc.)

### 5.8 Analytics
- [ ] Add Vercel Analytics for Web Vitals monitoring
- [ ] Add Plausible Analytics (or Vercel Web Analytics) for page views (privacy-friendly, no cookies)
- [ ] Track key events: bean viewed, brew method selected, filter applied, comparison made, favorite added, share clicked
- [ ] Dashboard for monitoring engagement and popular beans

### 5.9 PWA Basics
- [ ] Create `manifest.json` with app name, icons, theme color, display: standalone
- [ ] Add to root layout `<head>`
- [ ] Configure service worker with `@ducanh2912/next-pwa` or `next-pwa`
- [ ] Cache strategies:
  - Bean data JSON: cache-first (update in background)
  - Images: cache-first with stale-while-revalidate
  - Educational content: cache-first
  - Map tiles: network-first (Mapbox handles its own caching)
- [ ] Offline fallback page for when network is unavailable
- [ ] Test add-to-homescreen on iOS and Android

### 5.10 End-to-End Tests
- [ ] Set up Playwright with test fixtures
- [ ] Critical flow tests:
  - [ ] Land on map -> markers visible -> click marker -> bean panel opens with correct data
  - [ ] Apply filters -> markers fade -> clear filters -> all markers return
  - [ ] Cmd+K search -> type bean name -> select result -> map flies to bean
  - [ ] Open brew recommendation -> view full details -> use dose calculator
  - [ ] Add 2 beans to comparison -> open comparison view -> radar chart overlays
  - [ ] Toggle dark/light mode -> map and UI update
  - [ ] Navigate to bean detail page -> all sections render -> "View on Map" works
  - [ ] Mobile: bottom sheet opens and drags between snap points
- [ ] Run in CI (GitHub Actions) on push to main
- [ ] Visual regression tests for key components (optional: Playwright screenshots)

### 5.11 Documentation
- [ ] Write README.md:
  - Project overview and screenshots
  - Tech stack summary
  - Local development setup instructions
  - Environment variables guide
  - Project structure overview
  - Data contribution guide (how to add new beans to `beans.json`)
  - Deployment instructions (Vercel)
- [ ] Add CONTRIBUTING.md with code style, PR process, data quality guidelines
- [ ] Add LICENSE (MIT or similar)

### 5.12 Production Launch
- [ ] Final deploy to Vercel production environment
- [ ] Set up custom domain (e.g., beanmap.coffee or bean-map.vercel.app)
- [ ] Verify all pages load correctly in production
- [ ] Verify OG images, sitemap, robots.txt in production
- [ ] Test on real mobile devices (iOS Safari, Android Chrome)
- [ ] Submit sitemap to Google Search Console
- [ ] Create launch announcement / social media posts

### Phase 5 Verification
- [ ] Lighthouse scores: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+
- [ ] Core Web Vitals pass in Vercel Analytics
- [ ] All Playwright E2E tests pass in CI
- [ ] Full keyboard navigation works across all pages
- [ ] VoiceOver reads all content meaningfully
- [ ] PWA installs and works offline (cached content)
- [ ] No console errors or warnings in production build
- [ ] Custom domain resolves and HTTPS works
- [ ] OG images render correctly when shared on Twitter/Facebook/LinkedIn
