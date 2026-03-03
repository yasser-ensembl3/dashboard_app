# MetaVault — Dashboard

Aggregated command-center dashboard that unifies data from all vault apps (Media Vault, Research Vault, Stoic Vault, Tao Promotion) into a single Nextra-powered interface. Pulls live data from 6 Notion databases, GitHub Project V2, and uses Claude AI for media curation. Three-layer caching (server in-memory, CDN, client localStorage).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (Pages Router) |
| Docs engine | Nextra 2.13 (docs theme) |
| Language | TypeScript |
| Styling | Inline styles (dark theme, no Tailwind) |
| Data layer | Notion API SDK (@notionhq/client) |
| AI | Anthropic Claude Haiku 4.5 |
| GitHub | GraphQL API (Project V2) |
| Deployment | Vercel |

## Architecture

```
Dashboard MiniVault/
├── pages/
│   ├── index.mdx                  # Overview — command center
│   ├── datavault.mdx              # Research — saved articles
│   ├── contentvault.mdx           # Media — content tracker
│   ├── stockvault.mdx             # Stoic — investment data (static)
│   ├── tao-promotion.mdx          # Tao — book promotion KPIs
│   ├── _meta.json                 # Nextra sidebar navigation
│   ├── _app.tsx                   # App wrapper
│   └── api/
│       ├── dashboard.ts           # Aggregated dashboard data
│       ├── contentvault.ts        # ContentVault items
│       ├── datavault.ts           # DataVault/saved articles
│       ├── digest.ts              # Cross-vault activity feed
│       ├── ai/media-insights.ts   # AI-ranked media via Claude
│       ├── github/issues.ts       # GitHub Project V2 board
│       └── tao/
│           ├── status.ts          # Tao KPIs and goals
│           ├── orders.ts          # Tao orders (filter: unfulfilled)
│           ├── tasks.ts           # Tao tasks (filter: status)
│           └── feedback.ts        # Tao reviews
├── components/
│   ├── DashboardData.tsx          # Overview sections (6 components)
│   ├── TaoPromotionData.tsx       # Tao sections (8 components)
│   ├── ContentVaultData.tsx       # Media sections (6 components)
│   ├── DataVaultData.tsx          # Research sections (5 components)
│   ├── VaultCard.tsx              # Generic vault card (legacy)
│   ├── MetricsDisplay.tsx         # Generic metrics grid (legacy)
│   ├── VaultLink.tsx              # External link button
│   ├── LoadingState.tsx           # Loading skeletons + error state
│   └── index.ts                   # Barrel exports
├── hooks/
│   └── useNotionData.ts           # Client fetch with 5-min localStorage cache
├── lib/
│   ├── notion.ts                  # Notion API client + 12 property helpers
│   ├── types.ts                   # All TypeScript interfaces
│   └── cache.ts                   # Server-side 30-min cache with fingerprint invalidation
├── data/
│   └── vaults.json                # Static data (Stoic page)
├── styles/
│   └── globals.css                # Nextra overrides + mobile responsive
└── theme.config.tsx               # Nextra theme config (grayscale, logo)
```

## Pages

| Route | Display Name | Data Source | Description |
|-------|-------------|-------------|-------------|
| `/` | Overview | All vaults + GitHub + AI | Command center: action required, workflow, media+research, goals, actions, digest |
| `/datavault` | Research | Notion DataVault DB | Saved articles list |
| `/contentvault` | Media | Notion ContentVault DB | Content tracker with metrics by type/source |
| `/stockvault` | Stoic | Static JSON | Investment companies and stock data |
| `/tao-promotion` | Tao | Notion Tao DBs (4) | Book promotion: orders, tasks, goals, reviews |

## Overview Page Sections

The main dashboard (`index.mdx`) renders 6 sections:

| Section | Component | API | Source |
|---------|-----------|-----|--------|
| Action Required | `ActionRequiredBanner` | `/api/tao/orders?filter=unfulfilled` | Unfulfilled Tao orders |
| Weekly Workflow | `WeeklyWorkflow` | none | Placeholder (coming soon) |
| Media + Research | `MediaAndResearch` | `/api/ai/media-insights` | Claude AI ranks content + articles |
| Goals & Metrics | `GoalsAndMetrics` | `/api/dashboard` | Tao orders + goals aggregated |
| Actions / To Do | `ActionsToDo` | `/api/github/issues` | GitHub Project V2 board items |
| Digest | `DigestFeed` | `/api/digest` | Cross-vault activity timeline |

## API Routes

### Core

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Aggregated data: Tao orders (count, revenue, unfulfilled), goals, ContentVault/DataVault counts |
| `GET /api/contentvault` | All ContentVault items with type/source breakdown |
| `GET /api/datavault` | All saved articles from DataVault |
| `GET /api/digest` | Cross-vault activity feed from 5 sources (Tao orders, Tao tasks, ContentVault, DataVault, GitHub commits) merged chronologically |

### AI

| Endpoint | Description |
|----------|-------------|
| `GET /api/ai/media-insights` | Claude Haiku 4.5 ranks ContentVault + DataVault items by relevance to active tasks. Falls back to recency-sorted list if API fails. |

### GitHub

| Endpoint | Description |
|----------|-------------|
| `GET /api/github/issues` | Fetches GitHub Project V2 board items (user: GuillaumeRacine, project #4) via GraphQL |

### Tao Promotion

| Endpoint | Description |
|----------|-------------|
| `GET /api/tao/status` | KPIs: total orders, revenue, unfulfilled count + goals from goals DB |
| `GET /api/tao/orders` | Orders list. `?filter=unfulfilled` returns only unfulfilled |
| `GET /api/tao/tasks` | Tasks list. `?status=To Do` filters by status |
| `GET /api/tao/feedback` | Reviews. `?limit=5&recent=true` for recent subset |

## Three-Layer Caching

```
Layer 1: Server in-memory (lib/cache.ts)
  - 30-min TTL
  - Fingerprint-based invalidation (hash of item IDs + timestamps)
  - Used by: /api/digest, /api/ai/media-insights

Layer 2: CDN / Vercel Edge
  - Cache-Control: s-maxage=300, stale-while-revalidate=600
  - All API routes set these headers

Layer 3: Client localStorage (hooks/useNotionData.ts)
  - 5-min TTL per endpoint
  - useNotionData<T> and useMultipleNotionData<T> hooks
```

## Notion Databases (6)

| Database | Env Var | Used By |
|----------|---------|---------|
| ContentVault | `NOTION_CONTENTVAULT_DB` | Media page, AI insights, digest |
| DataVault | `NOTION_DATAVAULT_DB` | Research page, AI insights, digest |
| Tao Orders | `NOTION_TAO_ORDERS_DB` | Tao page, dashboard, digest |
| Tao Tasks | `NOTION_TAO_TASKS_DB` | Tao page, AI insights, digest |
| Tao Feedback | `NOTION_TAO_FEEDBACK_DB` | Tao reviews |
| Tao Goals | `NOTION_TAO_GOALS_DB` | Tao page, dashboard |

### Notion Property Helpers (`lib/notion.ts`)

12 typed helper functions for extracting Notion properties: `getTitle`, `getRichText`, `getNumber`, `getSelect`, `getMultiSelect`, `getDate`, `getUrl`, `getFileUrl`, `getPerson`, `getAnyText`, `formatDate`, plus `queryDatabase` wrapper.

## Digest Feed

`/api/digest` merges activity from 5 sources into a unified chronological timeline:

1. **Tao Orders** — recent orders with customer/total
2. **Tao Tasks** — recently modified tasks with status
3. **ContentVault** — recently added media items
4. **DataVault** — recently added articles
5. **GitHub** — recent commits from `GuillaumeRacine/ensemble_prototypes`

Uses `Promise.allSettled` so partial failures don't break the feed.

## AI Media Curation

`/api/ai/media-insights` uses Claude Haiku 4.5 to rank content:

1. Fetches active tasks from Tao Tasks DB
2. Fetches recent items from ContentVault + DataVault
3. Sends to Claude with prompt to rank by relevance to current work
4. Returns AI-ranked list with relevance scores
5. Falls back to recency-sorted list if Anthropic API is unavailable

## External Vault Links

Each page links to its corresponding standalone app:

| Page | App URL |
|------|---------|
| Research | datavault-rust.vercel.app |
| Media | media-minivault.vercel.app |
| Stoic | stock-vault.vercel.app |
| Tao | tao-promotion.vercel.app |

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

## Design Notes

- **Inline styles** — all components use `style={{}}` objects, no Tailwind or CSS modules. Dark gray palette (#1f2937, #374151, #4b5563, #6b7280, #9ca3af).
- **Hover via JS** — `onMouseEnter`/`onMouseLeave` handlers changing inline background colors.
- **Conditional links** — items with URLs render as `<a>`, others as `<div>`.
- **Graceful degradation** — AI insights fall back to recency sort. Digest uses `Promise.allSettled`.
- **Notion type polymorphism** — Status field handled as `status`, `select`, or `rich_text`.
- **Legacy components** — `VaultCard` and `MetricsDisplay` exist but aren't used by current pages.
