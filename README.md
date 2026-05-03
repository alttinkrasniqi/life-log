# Life Log

A retrospective personal analytics app. Log what you actually did each day across the parts of your life that matter — health, learning, work, wellbeing, finance, or whatever you set up — and see real trends, streaks, and where you've been slacking.

This is *not* a coaching app. It doesn't tell you what to do. It tracks what you've done and shows you the patterns.

## Tech

- **React 18** + **TypeScript** + **Vite**
- **Zustand** with `persist` middleware → localStorage (everything stays on your device)
- **Tailwind CSS** with custom dark warm-neutral design tokens
- **Recharts** for trend charts, hand-rolled SVG for sparklines and the yearly heatmap
- **Framer Motion** for modal transitions
- **date-fns** for time math

No backend. No accounts. Refresh the page and your data is still there.

## Getting started

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
# 1. Unzip the project, then
cd life-log

# 2. Install dependencies (one-time, ~30 seconds)
npm install

# 3. Run the dev server
npm run dev
```

The app opens automatically at <http://localhost:5173>.

To produce a production build:

```bash
npm run build
npm run preview
```

## How it works

The data model has four entities and is fully **modular** — adding new categories or metric types requires no code changes.

| Entity     | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| `Category` | Top-level area of life. Has a name, icon, color.                      |
| `Metric`   | A specific thing you track inside a category. Has a type & aggregation. |
| `Entry`    | A single log: timestamp, value, optional note.                        |
| `Target`   | Optional weekly/monthly goal for a metric (used for adherence).       |

A `Metric` has both a **type** (`number`, `duration`, `count`, `boolean`, `scale`) and an **aggregation** (`sum`, `avg`, `last`, `max`, `min`, `count`) — so the same plumbing handles "calories per day (sum)", "current weight (last)", "average mood (avg)", and "gym sessions this month (count)".

## App structure

```
src/
├── types.ts                  # Core data shapes
├── store/
│   ├── useStore.ts           # Zustand store with localStorage persistence
│   └── seed.ts               # Default categories & metrics for first launch
├── lib/
│   ├── analytics.ts          # Aggregations, streaks, heatmap, deltas
│   ├── date.ts               # Period ranges, formatters
│   ├── format.ts             # Value formatting per metric type
│   └── cn.ts                 # Tailwind class joiner
├── components/
│   ├── Layout.tsx            # Sidebar + main content shell
│   ├── EntryModal.tsx        # The fast-logging modal
│   ├── CategoryModal.tsx     # Create/edit categories
│   ├── MetricModal.tsx       # Create/edit metrics
│   ├── TrendChart.tsx        # Recharts area + rolling-avg line
│   ├── Sparkline.tsx         # Tiny inline SVG trend
│   ├── Heatmap.tsx           # Yearly contribution-style grid
│   ├── PeriodTabs.tsx        # Week/Month/Year/All selector
│   └── StatCard.tsx          # Headline stat with delta + sparkline
└── pages/
    ├── Today.tsx             # Daily ritual: timeline + quick-add
    ├── Insights.tsx          # Period-selectable analytics dashboard
    ├── Categories.tsx        # Manage categories
    ├── CategoryDetail.tsx    # Drill into one category
    ├── MetricDetail.tsx      # Deep stats: streaks, heatmap, target, history
    └── Settings.tsx          # Backup, restore, reset
```

## Daily flow

1. Open the app — lands on **Today**.
2. Tap a chip in the **Quick log** row → modal opens with last value pre-filled → adjust → Enter to save. Under 30 seconds.
3. Today's timeline updates instantly.
4. Visit **Insights** for the dashboard, or click into any metric for the deep view (streaks, target adherence, yearly heatmap, all entries).

## Customizing

- **Add a category:** Categories page → "+ New category". Pick a name, color, icon.
- **Add a metric:** Open any category → "+ New metric". Choose type, aggregation, optional unit.
- **Pin to Today:** On any metric, toggle the pin so it appears in the Quick log row. Anything not pinned still works — you just access it via the Categories page.
- **Set a target:** On a metric's detail page, define a weekly or monthly goal (≥ or ≤). Used for adherence math.

## Data backup

Everything lives in `localStorage` under the key `life-log-store`. To back up or migrate:

- **Settings → Export as JSON** downloads a complete snapshot.
- **Settings → Import from JSON** restores from a snapshot (replaces current data).

If you clear browser data or use incognito, the log is gone — back up regularly if you care about long-term history.

## Known limitations

- Single-device only (no sync). The schema is versioned (`schemaVersion: 1`) so a future sync layer is a one-file change.
- No cross-metric correlations yet (planned: "sleep vs gym frequency", "deep work vs mood").
- Per-entry timestamp is the moment you log — if you want to log retroactively for a specific time, edit the entry afterward.

## License

Personal use. Build whatever on top of it.
