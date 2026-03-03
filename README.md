# MetaVault — Dashboard

Aggregated command-center dashboard that unifies data from all vault apps (Media Vault, Research Vault, Stoic Vault, Tao Promotion) into a single Nextra-powered interface. Pulls live data from 6 Notion databases, GitHub Project V2 board, and uses Claude AI (Haiku 4.5) for media curation. Features a cross-vault digest feed, three-layer caching, and mobile-responsive inline-styled components.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (Pages Router) |
| Docs engine | Nextra 2.13 (docs theme, grayscale) |
| Language | TypeScript |
| Styling | Inline styles (`style={{}}`) + styled-jsx + globals.css (no Tailwind) |
| Data layer | Notion SDK (@notionhq/client ^2.2.15) |
| AI | Anthropic SDK (@anthropic-ai/sdk ^0.74.0) — Claude Haiku 4.5 |
| GitHub | GraphQL API (Project V2) |
| Deployment | Vercel |

## Architecture

```
Dashboard MiniVault/
├── pages/
│   ├── index.mdx                  # Overview — command center (6 sections)
│   ├── datavault.mdx              # Research — saved articles
│   ├── contentvault.mdx           # Media — content tracker
│   ├── stockvault.mdx             # Stoic — investment data (fully static)
│   ├── tao-promotion.mdx          # Tao — book promotion KPIs
│   ├── _meta.json                 # Nextra sidebar: Overview, Research, Media, Stoic, Tao
│   ├── _app.tsx                   # App wrapper (imports globals.css)
│   └── api/
│       ├── dashboard.ts           # Aggregated KPIs from 4 Notion DBs
│       ├── contentvault.ts        # ContentVault items + metrics
│       ├── datavault.ts           # DataVault saved articles
│       ├── digest.ts              # Cross-vault activity feed (5 sources, fingerprint cache)
│       ├── ai/media-insights.ts   # Claude Haiku 4.5 media ranking + fallback
│       ├── github/issues.ts       # GitHub Project V2 board (GraphQL)
│       └── tao/
│           ├── status.ts          # KPIs: revenue, unfulfilled, goals (getLatestMetric)
│           ├── orders.ts          # Orders with Notion-side unfulfilled filter
│           ├── tasks.ts           # Tasks with client-side status filter (polymorphic)
│           └── feedback.ts        # Reviews with ?recent=true (last 3 months)
├── components/
│   ├── DashboardData.tsx          # 6 overview components (627 lines)
│   ├── TaoPromotionData.tsx       # 8 Tao components (252 lines)
│   ├── ContentVaultData.tsx       # 6 media components (212 lines)
│   ├── DataVaultData.tsx          # 5 research components (197 lines)
│   ├── VaultCard.tsx              # Generic vault card (legacy, unused)
│   ├── MetricsDisplay.tsx         # Generic metrics grid (legacy, unused)
│   ├── VaultLink.tsx              # External link button with SVG icon
│   ├── LoadingState.tsx           # 4 skeleton types + ErrorState with retry
│   └── index.ts                   # Barrel exports (25 components)
├── hooks/
│   └── useNotionData.ts           # Client fetch hooks + 5-min localStorage cache
├── lib/
│   ├── notion.ts                  # Notion SDK client + 12 property helpers
│   ├── types.ts                   # 14 TypeScript interfaces
│   └── cache.ts                   # Server-side 30-min cache + fingerprint invalidation
├── data/
│   └── vaults.json                # Static snapshot (Stoic page: 12 stocks, 21 investments)
├── styles/
│   └── globals.css                # Nextra overrides + 3 responsive breakpoints
└── theme.config.tsx               # Nextra theme: grayscale, "MetaVault" logo
```

## Pages

| Route | Sidebar Name | Data Source | Components |
|-------|-------------|-------------|------------|
| `/` | Overview | All Notion DBs + GitHub + Claude AI | ActionRequiredBanner, WeeklyWorkflow, MediaAndResearch, GoalsAndMetrics, ActionsToDo, DigestFeed |
| `/datavault` | Research | Notion DataVault DB | DataVaultHeader, DataVaultItems (expandable), DataVaultAbout, DataVaultLastUpdated |
| `/contentvault` | Media | Notion ContentVault DB | ContentVaultHeader, ContentVaultMetrics, ContentVaultItems, ContentVaultBySource |
| `/stockvault` | Stoic | Static JSON (`data/vaults.json`) | No components — inline MDX rendering 12 stock companies + 21 investment companies grid |
| `/tao-promotion` | Tao | Notion Tao DBs (4) | TaoHeader, TaoGoalsAndMetrics, TaoUnfulfilledOrders, TaoPendingTasks |

Each page includes a `VaultLink` button to its standalone app.

## Overview Page — Command Center

The main dashboard (`index.mdx`) renders 6 sections in priority order:

### 1. Action Required Banner

**Component**: `ActionRequiredBanner` — **API**: `GET /api/tao/orders?filter=unfulfilled`

Red-background alert showing unfulfilled Tao orders count. Hidden when count is 0. Links to tao-promotion.vercel.app.

### 2. Weekly Workflow

**Component**: `WeeklyWorkflow` — **API**: none (client-side)

7-column day grid highlighting today's day of week. Displays "Coming soon — weekly workflow tracking."

### 3. Media + Research

**Component**: `MediaAndResearch` — **API**: `GET /api/ai/media-insights`

Two rendering modes:

- **AI view** (primary): Items ranked by Claude with colored left borders based on `relevanceScore` (green ≥80, yellow ≥50, gray <50). Each item shows vault badge (CV=purple, DV=blue), summary, and relevance reason.
- **Fallback view**: If AI unavailable, fetches `/api/contentvault` + `/api/datavault` separately, merges by `lastEdited` descending, shows top 5 items.

### 4. Goals & Metrics

**Component**: `GoalsAndMetrics` — **API**: `GET /api/dashboard`

4 KPI cards in a grid, each linking to tao-promotion.vercel.app:
- Amazon Sales (count)
- Amazon Reviews (combined .com + .ca)
- Subscribers (count)
- Shopify Revenue (dollar amount)

### 5. Actions / To Do

**Component**: `ActionsToDo` — **API**: `GET /api/github/issues`

GitHub Project V2 board items grouped by status with colored headers:
- "Up next" (yellow `#f59e0b`)
- "In progress" (blue `#3b82f6`)
- "For Review" (purple `#8b5cf6`)

Each status section is expandable to show individual issues.

### 6. Digest

**Component**: `DigestFeed` — **API**: `GET /api/digest`

Cross-vault activity timeline with source badges:
- ContentVault (CV) — purple `#7c3aed`
- DataVault (DV) — blue `#2563eb`
- Tao Promotion (TP) — amber `#d97706`
- GitHub (GH) — gray `#6b7280`

Each entry is expandable to show structured details (DigestDetail label/value pairs). Displays relative time ("2h ago", "3d ago").

## API Routes (10 endpoints)

All routes enforce `GET` only (405 for other methods). All set `Cache-Control: s-maxage=300, stale-while-revalidate=600`.

### Core Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Fetches 4 Notion DBs in parallel via `Promise.allSettled`. Returns: taoStatus (unfulfilled count, total revenue, latest amazon sales/reviews/subscribers from goals DB using `getLatestMetric()`) + ContentVault/DataVault item counts. |
| `GET /api/contentvault` | All items with URL priority: Audio summary (files) > Audio Link (url) > Text summary (files). Returns metrics (totalItems, toRead, inbox), bySource, byType, items. |
| `GET /api/datavault` | Saved articles with Title, Authors, Subject, Description, Submission date, pdf Link. Returns metrics (totalItems), status, items. |
| `GET /api/digest` | 5 fetchers: ContentVault (5), DataVault (5), Tao Orders (5), Tao Tasks (10 → filter completed → take 5), GitHub (Project V2 issues + last 3 commits). Merges chronologically, returns top 10. Uses `Promise.allSettled` + fingerprint server cache. |

### AI Endpoint

| Endpoint | Description |
|----------|-------------|
| `GET /api/ai/media-insights` | Fetches ContentVault + DataVault + active Tao Tasks (In Progress or To Do) in parallel. Checks fingerprint cache. Calls Claude Haiku 4.5 with ranking prompt (recency, status, task alignment, diversity, novelty). Validates AI response IDs against real Notion page IDs (drops hallucinated items). Returns max 5 items with relevanceScore + relevanceReason. Falls back to recency-sorted list if no API key or AI fails. |

### GitHub Endpoint

| Endpoint | Description |
|----------|-------------|
| `GET /api/github/issues` | GraphQL query for user `GuillaumeRacine`, project #4. Returns items grouped by status with counts. |

### Tao Promotion Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/tao/status` | Queries Orders DB (unfulfilled count, total revenue) + Goals DB. Uses `getLatestMetric()` to find most recent value per metric by sorting on "Last Updated" date. Metrics: "number of sales", "amazoncom reviews", "amazonca reviews", "number of subscribers". |
| `GET /api/tao/orders` | Orders sorted by Date descending. `?filter=unfulfilled` applies Notion-side select filter on Fulfillment property. Properties: Order (title), Customer (rich_text), Total $ (number), Date (date), Payment (select), Fulfillment (select). |
| `GET /api/tao/tasks` | Fetches all tasks, filters status client-side (because Status can be rich_text, not filterable in Notion API). Status polymorphism: tries `status.name`, then `select.name`, then `rich_text[0].plain_text`. Priority: tries `select.name`, then `rich_text[0].plain_text`. `?status=To Do` to filter. |
| `GET /api/tao/feedback` | Reviews sorted by created_time descending. `?recent=true` filters to last 3 months. `?limit=5` for page size. Properties: Title/Name (title), Feedback/Content (rich_text), User Name (rich_text). |

## Three-Layer Caching

```
Layer 1: Server in-memory (lib/cache.ts)
├── TTL: 30 minutes
├── Fingerprint-based invalidation
│   buildFingerprint(): hashes item IDs + lastEdited timestamps, sorted
│   getCached(): returns null if expired OR fingerprint mismatch
└── Used by: /api/digest, /api/ai/media-insights

Layer 2: CDN / Vercel Edge
├── Cache-Control: s-maxage=300 (5 min)
├── stale-while-revalidate=600 (10 min)
└── Set on all 10 API routes

Layer 3: Client localStorage (hooks/useNotionData.ts)
├── TTL: 5 minutes per endpoint
├── useNotionData<T>(endpoint) — single fetch with cache
├── useMultipleNotionData<T>(endpoints) — parallel fetch with cache
├── refetch() — bypasses cache (skipCache=true)
└── clearCache(key?) — clears one or all notion-* entries
```

## Notion Databases (6)

| Database | Env Var | Properties Used in Code |
|----------|---------|------------------------|
| ContentVault | `NOTION_CONTENTVAULT_DB` | Link (title), type (select), Status (select), Date (date), Audio Link (url), Audio summary (files), Text summary (files) |
| DataVault | `NOTION_DATAVAULT_DB` | Title (title), Authors (rich_text), Subject (rich_text), Description (rich_text), Submission (date), pdf Link (url) |
| Tao Orders | `NOTION_TAO_ORDERS_DB` | Order (title), Customer/Name (rich_text), Total $ (number), Date (date), Payment (select), Fulfillment (select) |
| Tao Tasks | `NOTION_TAO_TASKS_DB` | Name (title), Status (status/select/rich_text — polymorphic), Priority (select/rich_text), Due Date (date) |
| Tao Feedback | `NOTION_TAO_FEEDBACK_DB` | Title/Name (title), Feedback/Content (rich_text), User Name (rich_text) |
| Tao Goals | `NOTION_TAO_GOALS_DB` | Metric Name (title), Number (number), Last Updated (date) |

### Notion Property Helpers (`lib/notion.ts`)

Uses `@notionhq/client` SDK (not raw fetch). 12 typed extraction functions: `getTitle`, `getRichText`, `getNumber`, `getSelect`, `getMultiSelect`, `getDate`, `getUrl`, `getFileUrl`, `getPerson`, `getAnyText`, `formatDate`, plus `queryDatabase` wrapper using typed `QueryDatabaseParameters`.

## Component Architecture

### Per-Page Component Files

| File | Components | Description |
|------|-----------|-------------|
| `DashboardData.tsx` (627 lines) | ActionRequiredBanner, WeeklyWorkflow, MediaAndResearch, GoalsAndMetrics, ActionsToDo, DigestFeed | Overview page. AI + fallback views. GitHub 3-column board. Digest timeline with expandable details. |
| `TaoPromotionData.tsx` (252 lines) | TaoHeader, TaoGoalsAndMetrics, TaoMetrics, TaoUnfulfilledOrders, TaoPendingTasks, TaoGoals, TaoRecentReviews, TaoLastUpdated | Tao page. 5 KPI cards (Amazon Sales, Shopify Revenue, Subscribers, Amazon.com Reviews, Amazon.ca Reviews). Orders table. Task list with priority badges. |
| `ContentVaultData.tsx` (212 lines) | ContentVaultHeader, ContentVaultMetrics, ContentVaultBySource, ContentVaultByType, ContentVaultItems, ContentVaultLastUpdated | Media page. 3 metrics (Total Items, To Read, Inbox). Source/type breakdowns. Items with status color coding (yellow=To Read/Inbox, green=Done). Show more/less toggle. |
| `DataVaultData.tsx` (197 lines) | DataVaultHeader, DataVaultStatus, DataVaultItems, DataVaultAbout, DataVaultLastUpdated | Research page. Expandable article list with rotating ▶ arrow. Expanded view shows Description, Authors, Subject, Submitted date, "View PDF" link. |

### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `VaultLink` | `VaultLink.tsx` | External link button ("Open {name}") with SVG arrow icon. White bg, styled-jsx. |
| `LoadingState` | `LoadingState.tsx` | 4 skeleton types: `spinner` (rotating circle), `skeleton` (rows), `card` (2-col grid), `metrics` (metric boxes). All with pulse animation. Uses styled-jsx. |
| `ErrorState` | `LoadingState.tsx` | Error display with message + optional retry button. Dark bg. |
| `VaultCard` | `VaultCard.tsx` | Generic card with MetricsDisplay + VaultLink. Legacy, not used by current pages. |
| `MetricsDisplay` | `MetricsDisplay.tsx` | Metrics grid with 35 label mappings. Legacy, not used by current pages. |

### Styling Pattern

All page components use **inline `style={{}}` objects**. No Tailwind, no CSS modules. Dark gray palette:
- Backgrounds: `#1f2937`, `#374151`, `#4b5563`
- Text: `#6b7280`, `#9ca3af`, `#d1d5db`, `#f9fafb`
- Hover effects via `onMouseEnter`/`onMouseLeave` changing inline `backgroundColor`
- Conditional rendering: items with URLs render as `<a>`, others as `<div>`

Shared/legacy components use **styled-jsx** (`<style jsx>`) for scoped CSS with dark mode via `:global(.dark)`.

### Responsive Design (globals.css)

Nextra overrides with compact heading/paragraph sizes. 3 breakpoints:
- `768px` — hide TOC, single-column cards, tighter digest timeline, 2×2 goals grid
- `480px` — smaller headings, reduced padding
- `380px` — extra-tight digest timeline

Named CSS classes for component grids: `.goals-grid`, `.actions-grid`, `.workflow-grid`, `.digest-timeline`, `.vault-cards-grid`.

## TypeScript Interfaces (`lib/types.ts`)

14 interfaces covering all data shapes:
- Tao: `TaoOrder`, `TaoTask`, `TaoReview`, `TaoStatus`
- ContentVault: `ContentItem`, `ContentVaultData`
- DataVault: `DataItem`, `DataVaultData`
- AI: `MediaInsightItem`, `MediaInsightsResponse`
- Digest: `DigestDetail`, `DigestItem`, `DigestResponse`
- Legacy: `VaultMetrics`, `VaultData`

## Static Data (`data/vaults.json`)

Snapshot data for the Stoic page (fully static, no API calls):
- 12 stock companies: Amazon, Circle, Coinbase, Constellation Software, Ebay, Etsy, FIGS, LVMH, nVidia, Shopify, Wayfair, Yeti
- 21 investment companies: Abra Promotions, Builder Io, Ceremonia, Constructor, Daily Blends, Design Stripe, Helika, Hookdeck, Immune Biosolution, Kotn, Nolk, Pivohub, Ripple AI, Screenloop, Shakepay, Three Ships, Vasco, Waverly, Wavyy, Wonderment, Zeffy
- 3 quarters of analysis
- Last updated: 2026-01-30

## Nextra Theme Configuration

- Logo: bold "MetaVault"
- Grayscale: `primaryHue: 0`, `primarySaturation: 0`
- Footer: "MetaVault - Your vault ecosystem hub"
- Sidebar: collapsible (level 1), toggle button
- TOC: back-to-top enabled
- SEO: title template `%s – MetaVault`

## External Vault Links

| Page | Standalone App |
|------|---------------|
| Research | datavault-rust.vercel.app/areas |
| Media | media-minivault.vercel.app/vault |
| Stoic | stock-vault.vercel.app |
| Tao | tao-promotion.vercel.app/dashboard |

## Environment Variables

```env
# Notion
NOTION_API_KEY=ntn_xxx
NOTION_CONTENTVAULT_DB=xxx
NOTION_DATAVAULT_DB=xxx
NOTION_TAO_ORDERS_DB=xxx
NOTION_TAO_TASKS_DB=xxx
NOTION_TAO_FEEDBACK_DB=xxx
NOTION_TAO_GOALS_DB=xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# GitHub
GITHUB_TOKEN=ghp_xxx
```

## Security

- **CVE-2026-0969 fix**: `next-mdx-remote` overridden to `^6.0.0` in `package.json` overrides
- All API keys are server-side only (no `NEXT_PUBLIC_` prefix)
- No authentication required — dashboard is read-only

## Setup

### Prerequisites

- Node.js 18+
- Notion integration with access to all 6 databases
- Anthropic API key (for AI media curation)
- GitHub PAT with `read:project` scope

### Installation

```bash
npm install
# Create .env.local with all variables above
npm run dev
# Open http://localhost:3000
```

### Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Deploy (framework auto-detected as Next.js)

## Design Decisions

1. **Nextra docs theme** — sidebar navigation, search, MDX pages with embedded React components
2. **Grayscale palette** — `primaryHue: 0`, `primarySaturation: 0` for neutral UI
3. **Inline styles over Tailwind** — page components use `style={{}}` for consistent dark theme
4. **Styled-jsx for shared** — LoadingState, VaultLink, VaultCard use `<style jsx>` for scoped CSS
5. **Three-layer caching** — server (30 min, fingerprint) + CDN (5 min) + client (5 min)
6. **AI ID validation** — media-insights validates Claude's response IDs against real Notion page IDs, drops hallucinated items
7. **Notion type polymorphism** — Status handled as `status`, `select`, or `rich_text` property types
8. **Client-side task filtering** — tasks filtered in JS because Status can be `rich_text` (not filterable in Notion API)
9. **Promise.allSettled everywhere** — dashboard, digest, AI all survive partial source failures
10. **ContentVault URL priority** — Audio summary > Audio Link > Text summary (prefers audio over text)
