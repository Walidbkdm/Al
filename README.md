# Algerian Ecom Command Center + Confirm Pro

A single-page operations dashboard for Algerian COD e-commerce sellers. Combines a business dashboard (profit, returns, ads, delivery, health score) with a smart order-confirmation system (Kanban orders, Darija call scripts, follow-ups, WhatsApp templates, agent leaderboard, wilaya risk).

![stack](https://img.shields.io/badge/stack-React%2018%20+%20Tailwind%20+%20Recharts-10b981)
![data](https://img.shields.io/badge/data-LocalStorage-blue)
![build](https://img.shields.io/badge/build-zero%20install-success)

## Quick start

This is a **zero-install** app. Open `index.html` in any modern browser — it loads React, ReactDOM, Tailwind, and Recharts from CDNs and compiles JSX in the browser via Babel standalone.

### Option 1: Open directly
Just double-click `index.html`. Everything runs locally in your browser.

### Option 2: Serve locally (recommended for development)
Any static server works:

```bash
# Python (any version)
python3 -m http.server 8000

# Node
npx serve .
```

Then open http://localhost:8000.

### Option 3: Deploy to GitHub Pages
Push this repo and enable Pages on the branch. The app is pure static assets.

## What's inside

```
index.html        # single HTML shell, loads CDN libs and app scripts
src/
  data.jsx        # Algerian wilayas, sample orders/returns/campaigns/agents
  utils.jsx       # formatters, profit/health/risk calculations, useLocalStorage
  components.jsx  # Sidebar, TopBar, StatCard, Badge, HealthGauge, Modal, ...
  pages.jsx      # 12 pages: Overview, Profit, Returns, Ads, Delivery,
                  # Orders (Kanban), Call Scripts, Follow-Ups, WhatsApp,
                  # Agents, Wilaya Risk, Settings
  app.jsx         # root, routing, localStorage wiring
```

## Modules

### Business dashboard
- **Profit Calculator** — realistic COD math including loss-per-returned-order; break-even return rate; sensitivity to return-rate reductions (−1% / −5% / −10%).
- **Return Rate Tracker** — per-wilaya entries with filters, CRUD, and a heatmap highlighting dangerous wilayas.
- **Ad Performance Analyzer** — CPM, CPC, CTR, CPA, ROAS, confirmation rate, delivery rate, net profit after ad spend. Auto-recommends Scale / Pause / Test / Fix confirmation / Fix delivery.
- **Delivery Company Comparator** — Yalidine, Procolis, Maystro, Ecotrack per wilaya; shows *true cost per confirmed order* (cost + return cost × return rate), flags the best-true vs. cheapest split.
- **Weekly Health Score** — 0–100 gauge with diagnosis and 3 recommended weekly actions.

### Confirm Pro
- **Orders Kanban** — 7 Arabic stages (جديد / تأكيد / مؤكد / أُرسل / تم / مرجوع / ملغي) with drag-and-drop, 24h+ highlighting, filters, search.
- **Smart Call Script Generator** — Darija scripts for 8 scenarios, plus one-click shorter WhatsApp version.
- **Follow-Up Scheduler** — auto-schedules 3 attempts (+2h, +22h, +38h), surfaces overdue/today/upcoming, one-click mark-as-called.
- **WhatsApp Templates** — 7 ready-to-send Darija templates with copy-to-clipboard.
- **Agent Performance Tracker** — leaderboard, top performer, coaching insights.
- **Wilaya Risk Scoring** — green / yellow / red per wilaya with a data-driven safety score and recommended action.

## Data

Everything persists to `localStorage` under the `aecc:v1:` prefix. Use **Settings → Export JSON** to back up and **Import JSON** to restore. **Reset to sample** restores the demo data.

## Tech

- React 18 (UMD, from CDN)
- Tailwind CSS (CDN)
- Recharts 2 (UMD, from CDN)
- Babel Standalone for in-browser JSX/ES2020
- No bundler, no package.json, no npm install

## Notes for later

The architecture is component-based and easy to move to Vite + TypeScript later:

1. `npm create vite@latest` with a React template.
2. Move each `src/*.jsx` into its own module and replace the `window.App*` globals with proper imports.
3. Drop the CDN tags from `index.html`.
