# Algerian Ecom Command Center (AECC)

A production-grade, fully interactive SaaS dashboard built for Algerian e-commerce businesses running on Cash-on-Delivery (COD).

It gives operators a single operational brain to stop bleeding margin to the five blind spots of Algerian COD commerce:
returns, fake orders, delivery-company choice, wilaya-level performance, and ad efficiency.

---

## Feature tour

| Module | Path | What it does |
| --- | --- | --- |
| Dashboard | `/` | KPI summary, trends, and links into every module |
| Real Profit Calculator | `/profit` | 12 inputs, live what-if sensitivity charts, break-even ROAS & max CPA, monthly projection |
| Return Rate Tracker | `/returns` | 58-wilaya heatmap, carrier breakdown, stacked weekly trend, add/edit/delete order logs |
| Ad Analyzer | `/ads` | Meta vs TikTok side-by-side, AI-style insights, per-campaign ranking with ROAS / CPA / drop-off |
| Delivery Comparator | `/delivery` | Yalidine / Maystro / Ecotrack / Procolis scored per wilaya with a focus selector |
| Business Health | `/health` | Animated gauge, 6-factor breakdown, radar chart, 6-week trajectory, critical regions |

### Extras
- Dark / light mode (auto + toggle)
- **Arabic**, **French**, and **English** with automatic RTL on Arabic
- Keyboard shortcuts (`g` then `d/p/r/a/l/h`, `t` to toggle theme)
- CSV export on every module
- PDF export via optimized print stylesheet (`Ctrl/Cmd + P` or the Export menu)
- Installable PWA (manifest + maskable icon)
- 100% client-side persistence via LocalStorage
- Fully responsive (mobile drawer, grid re-flow)
- Seeded demo data that regenerates deterministically (Reset button in header)

---

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** strict mode
- **Tailwind CSS 3.4** with custom design tokens (primary / success / warning / destructive / info)
- **shadcn/ui** style primitives built on Radix UI (dialog, dropdown, select, slider, progress, tabs, toast, etc.)
- **Recharts** for area / line / bar / radar
- **Framer Motion** for page, gauge, sidebar, and KPI animations
- **next-themes** for theme persistence
- **next/font** for Inter, Plus Jakarta Sans, and Noto Sans Arabic

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Visit the app
open http://localhost:3000
```

Build & start in production:
```bash
npm run build
npm run start
```

---

## Project layout

```
src/
├─ app/
│  ├─ layout.tsx         # Root layout + all providers + AppShell
│  ├─ page.tsx           # Dashboard overview
│  ├─ globals.css        # Tailwind + design tokens + print styles
│  ├─ profit/page.tsx    # Module 1
│  ├─ returns/page.tsx   # Module 2
│  ├─ ads/page.tsx       # Module 3
│  ├─ delivery/page.tsx  # Module 4
│  └─ health/page.tsx    # Module 5
├─ components/
│  ├─ ui/                # shadcn primitives
│  ├─ shell/             # Sidebar, Header, KeyboardShortcuts, AppShell
│  ├─ providers/         # ThemeProvider, I18nProvider, DataProvider
│  ├─ common/            # KpiCard, PageHeader, InsightCard, StatusPill, Field, ExportMenu, Skeleton
│  ├─ charts/            # ChartContainer, TrendArea, TrendLine, CategoricalBar
│  ├─ health/            # HealthGauge (Framer Motion SVG)
│  └─ returns/           # WilayaHeatmap
├─ lib/
│  ├─ types.ts           # Strong types for every domain object
│  ├─ wilayas.ts         # All 58 wilayas (code, FR + AR name, region)
│  ├─ delivery-companies.ts # 4 carriers + deterministic pricing / quality matrix
│  ├─ calculations.ts    # Profit, ad metrics, aggregations, health score
│  ├─ i18n.ts            # fr / ar / en translations
│  ├─ storage.ts         # Safe localStorage + useLocalStorage
│  ├─ seed.ts            # Deterministic mock data
│  └─ utils.ts           # cn, formatters, CSV, download helpers
public/
├─ manifest.webmanifest
├─ favicon.svg
└─ icon.svg
```

---

## Data model (LocalStorage)

| Key | Shape |
| --- | --- |
| `aecc:v1:lang` | `"fr" \| "ar" \| "en"` |
| `aecc:v1:profitInputs` | `ProfitInputs` object |
| `aecc:v1:orderLogs` | `OrderLog[]` |
| `aecc:v1:campaigns` | `AdCampaign[]` |

Reset seed data at any time via the circular arrow icon in the header.

---

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `g` → `d` | Dashboard |
| `g` → `p` | Profit Calculator |
| `g` → `r` | Returns & Wilayas |
| `g` → `a` | Ads |
| `g` → `l` | Delivery |
| `g` → `h` | Health |
| `t` | Toggle dark / light theme |

---

## Notes on accuracy

- Delivery-company pricing and quality are **seeded heuristically per wilaya** (deterministic pseudo-random), not scraped from the real carriers. Replace `buildDeliveryQuotes()` in `src/lib/delivery-companies.ts` with live quotes when you wire the real APIs.
- All numeric inputs are editable; the full data model is exportable as CSV for auditing.
- Works fully offline after the first page load (service worker is not required — all data lives in LocalStorage and all calculation logic runs in-browser).
