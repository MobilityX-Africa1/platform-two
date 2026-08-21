# MobilityX Ecosystem Map

A data platform mapping Africa's e-mobility sector — companies, countries, capital
allocators, and deal flow — sourced live from a curated Notion workspace and served as a
React app with an embedded AI research assistant.

This document is a handover reference: what the app is, how data flows through it, how the
visual-QA workflow works, and how to extend it safely.

---

## 1. What it is

Three "pillars" (not tabs — a user can enter from any one and cross-link to the others):

- **Countries** — 15 priority African markets, grouped into 4 regions, with market stats,
  EV policy, charging/swap infrastructure, and (for some markets) a TCO model comparing
  EV vs ICE two-wheelers (`Asset Economics`).
- **Companies** — the companies pipeline across 8 verticals (OEMs, fintech, logistics
  software, ride-hail, etc.), with scoring, funding stage, and a "Top 50" ranked view.
- **Capital** — investors/allocators active in African mobility, their ticket sizes,
  instruments, and focus areas.

A floating chat widget lets a user ask free-form questions ("which Kenyan companies raised
a Series A in 2025?") answered by an agentic Claude loop that searches and reads the same
Notion workspace live — see [§4](#4-the-notion-connection).

Everything the public site shows is sourced from Notion at request time (5-minute cache).
There is no local database — Notion **is** the database.

---

## 2. Architecture

```
frontend/          React 19 + Vite SPA (react-router, zustand, recharts)
backend/api/        Vercel serverless functions (Notion proxy + AI chat)
api/                 1-line re-export shim — see below
dist/                built static output (checked in from the last build)
```

- **`api/`** exists only because Vercel auto-detects serverless functions in a top-level
  `api/` directory — it can't be moved into `backend/`. `api/notion.js` and `api/chat.js`
  are thin re-exports of the real implementations in `backend/api/`. Edit the logic in
  `backend/api/`, never in the top-level `api/` shims.
- **`frontend/vite.config.js`** is the real Vite config; `npm run dev` / `build` /
  `preview` all pass `--config frontend/vite.config.js` explicitly (see `package.json`).
- **Routing** (`frontend/src/App.jsx`): `/`, `/countries`, `/country/:id`, `/compare`,
  `/companies`, `/company/:id`, `/allocators`, `/allocator/:id`, `/deals`,
  `/vertical/:name`, `/asset-economics`, `/asset-economics/:id` — all inside one `Layout`
  (dual-pane shell: left nav panel, right content panel).
- **State**: `zustand` stores in `frontend/src/store/` — `dataStore.js` is the one that
  matters (fetches + normalizes + cross-links all Notion data once on load); `filterStore.js` /
  `allocatorFilterStore.js` / `queryStore.js` hold UI filter state.

### Env vars (`.env`, not committed)

| Var | Used by | Purpose |
|---|---|---|
| `NOTION_TOKEN` | `backend/api/notion.js`, `backend/api/_lib/notionTools.js` | Notion integration token, read access to the workspace |
| `ANTHROPIC_API_KEY` | `backend/api/chat.js` | Powers the chat assistant (Claude, currently `claude-opus-5`) |
| `VITE_MAPBOX_TOKEN` | frontend (build-time) | Map rendering |

Set these in Vercel project settings for deployed environments; locally via `.env` +
`vercel dev` (`npm run vercel-dev`) if you need the API routes working, or `npm run dev`
(plain Vite) if you're only touching frontend-only UI and can tolerate `/api/*` 404s.

---

## 3. Data flow: Notion → screen

```
Notion workspace (6 data sources)
        │  REST query, Notion-Version 2025-09-03
        ▼
backend/api/notion.js   — allow-list filter (PUBLIC_FIELDS) + Publish gate + 5-min cache
        │  GET /api/notion?entity=<name>
        ▼
frontend/src/store/dataStore.js  — fetches all 5 entities, resolves relations by which
        │                           database the target page belongs to, cross-links records
        ▼
Pages / components read from the zustand store
```

Key points for anyone touching this:

- **`backend/api/_lib/notionIds.js`** maps short internal names (`countries`,
  `companiesPipeline`, `capitalAllocators`, `dealTracker`, `assessmentRecords`,
  `assetEconomics`) to Notion **data source IDs** (not page IDs — Notion's post-2025-09
  multi-source-database model). If Stuart's team ever moves/duplicates a database in
  Notion, this file needs the new ID.
- **`PUBLIC_FIELDS` in `backend/api/notion.js` is an allow-list, not a deny-list.** Only
  fields explicitly named there ever reach the client. This is deliberate: a new internal
  field added in Notion later (founder emails, deal notes, DD scores) is excluded by
  default instead of leaking until someone remembers to hide it. There's a matching
  `INTERNAL_ONLY_FIELDS` list purely for documentation/self-check — the server throws on
  boot if a field ever appears in both lists.
- **The `Publish` gate**: Companies Pipeline, Capital Allocators, and Countries all have a
  `Publish` checkbox in Notion. Unpublished rows must never reach the client. Countries is
  filtered client-side in `dataStore.js` rather than server-side, because company→country
  relations need to resolve even against a still-unpublished (stub) country — see the
  comment in `dataStore.js` for why.
- **Units**: `Total Funding Raised ($m)` and Deal Tracker's `Amount ($m)` are in millions
  in Notion, not raw dollars. Individual deal records are never rendered publicly — only
  aggregates (total raised, round count, latest round type). See `CHANGES.md` for the full
  field-mapping history from the July 2026 schema migration.
- **Full schema/history reference**: `CHANGES.md` documents every Notion field rename,
  the phase plan, and which "duplicate-looking" field pairs are intentionally distinct
  (e.g. `Petrol price` vs `Fuel price (USD/L)` — different sourced figures, never merge
  them). Read it before assuming a field name in the code is wrong.

---

## 4. The Notion connection

Two separate integrations talk to Notion, for two different purposes:

1. **`backend/api/notion.js`** — the data feed for the site itself. Straight REST query
   against a fixed data-source ID, filtered through `PUBLIC_FIELDS`, cached 5 minutes
   in-memory (serverless warm-instance cache; add `?fresh=1` to bypass it).
2. **`backend/api/chat.js` + `backend/api/_lib/notionTools.js`** — the AI assistant. This
   is an agentic loop (`claude-opus-5`, up to 8 tool-call turns) that gives Claude three
   tools — `search_notion`, `query_database`, `get_page_content` — and lets it decide what
   to look up per question, rather than the app pre-fetching everything. It has no
   built-in knowledge of the workspace; every answer is grounded in a live lookup, and the
   system prompt asks it to say so plainly when it can't find something rather than guess.

If you need to add a new Notion database to the platform: add its data source ID to
`notionIds.js`, add its public field allow-list to `PUBLIC_FIELDS`, and (if it should
participate in cross-linking) add it to `ENTITIES` / `DS_ENTITY` in `dataStore.js`.

---

## 5. Frontend design workflow (mandatory)

This repo has a **project-scoped Claude Code skill** at
`.claude/skills/frontend-design/SKILL.md` (surfaced to Claude as
`ecosystem-map:frontend-design`). It must be invoked **every session, before writing or
editing any UI code** — new component, redesign, or any change a human would judge by
looking at it. `CLAUDE.md` at the repo root states this as a hard rule ("Step 0 — mandatory
before any code").

What it enforces, in order:

1. **Use the existing design system, don't invent a second one.** The skill checks
   `frontend/src/index.css` first — real tokens already in use: `--plum`, `--sky`,
   `--leaf`, `--coral`, `--indigo` (+ `-dark`/`-bg` variants), Google Sans (display) /
   Roboto (body), the `--space-*` / `--radius-*` scale. Note this differs from the
   fallback palette written into `CLAUDE.md` (purple/teal, Fraunces/Plus Jakarta Sans) —
   that fallback only applies to a genuinely new app with no existing tokens. For this
   repo, match `index.css`, not `CLAUDE.md`'s Step 4.
2. **Brand assets check** — `ls brand_assets/` for a real logo/palette/font before
   improvising.
3. **Screenshot-driven visual QA, always on localhost** — never screenshot a `file:///`
   URL (fonts/CDN/relative paths won't render). Start the dev server, confirm it's
   returning 200, then screenshot.
4. **Minimum two comparison rounds** before calling any UI change done: screenshot → read
   the PNG with the Read tool (Claude has to actually look at it, not just save it) →
   note specific mismatches (pixel values, hex codes — not "looks off") → fix → screenshot
   again.
5. **Anti-generic guardrails** — no Tailwind default indigo/blue as primary color, no
   `transition: all`, no flat single-layer `box-shadow`, every clickable element needs
   hover/focus/active states, sections must alternate background/surface rather than
   repeating.

### Screenshot verification, concretely

Two scripts in `frontend/scripts/`, both Puppeteer-based, both save auto-incrementing PNGs
to `./screenshots/` (never overwritten):

- **`screenshot.mjs <url> [label]`** — plain `page.goto()` + full-page screenshot. Use
  this for anything reachable by a direct URL.
- **`screenshot-nav.mjs <baseUrl> <linkText...>`** — for routes that don't survive a hard
  reload. `frontend/src/main.jsx` resets client-side route state on load, so
  `page.goto()`-ing a deep link (e.g. `/company/roam`) won't land where you expect.
  This script instead loads the root and **clicks through the app's own nav**, by visible
  text, the way a real user would, then screenshots wherever that lands. Example:
  `node frontend/scripts/screenshot-nav.mjs http://localhost:5174 Companies Roam`.

Both scripts wait on `document.fonts.ready` and resize the viewport to the full rendered
height *before* capturing (not via Puppeteer's built-in `fullPage: true`) — doing the
resize themselves avoids a font-swap race that was corrupting text rendering mid-capture
with the multi-subset Google Sans font files this app uses. Don't "simplify" that back to
`fullPage: true` if you're touching these scripts — that regression is why it's written
this way.

Run via `npm run screenshot` (wraps `screenshot.mjs`) or call either script directly with
`node`.

---

## 6. How to add things

**A new page/route:**
1. Add the component under `frontend/src/pages/`.
2. Register the route in `frontend/src/App.jsx` inside the existing `<Layout>` element.
3. Invoke the `frontend-design` skill before writing any markup (§5).
4. If it needs new Notion data, see below.

**A new Notion field to surface:**
1. Confirm the field name and type directly in Notion — don't guess from `CHANGES.md`,
   which is a point-in-time migration log, not living documentation.
2. Add the exact field label to the relevant array in `PUBLIC_FIELDS` in
   `backend/api/notion.js`. If it's explicitly internal per `CHANGES.md`, add it to
   `INTERNAL_ONLY_FIELDS` instead (and definitely don't add it to both — startup will
   throw).
3. Consume it in `frontend/src/lib/normalize.js` (where raw Notion property shapes get
   flattened) and render it wherever it belongs.

**A new Notion database/pillar:**
1. Add its data source ID to `backend/api/_lib/notionIds.js`.
2. Add its allow-listed fields to `PUBLIC_FIELDS`.
3. Add it to `ENTITIES` / `DS_ENTITY` in `frontend/src/store/dataStore.js` if it should
   cross-link with existing records (relations resolve by which database the target page
   belongs to, not by property name — see the comment above `resolveRelations`).

**Changing what the AI assistant can do:** add/edit a tool in `backend/api/chat.js`
(`tools` array) and implement it in `backend/api/_lib/notionTools.js`. Keep the system
prompt's description of the workspace (streams/verticals/databases) in sync if the schema
changes.

---

## 7. Local development

```bash
npm install

# Frontend only (no working /api/* routes — fine for pure UI work)
npm run dev

# Full stack, including Notion + chat API routes (needs .env populated)
npm run vercel-dev

npm run build     # production build → dist/
npm run preview   # serve the build locally
npm run lint
npm run screenshot -- http://localhost:5173   # or whatever port dev printed
```

VS Code launch config at `.claude/launch.json` runs `npm run dev` on port 5173.

## 8. Deployment

Deployed on Vercel. `vercel.json` rewrites everything except `/api/*` to `index.html`
(SPA client-side routing). Vercel auto-detects the top-level `api/` folder as serverless
functions — see the shim note in §2. Set `NOTION_TOKEN`, `ANTHROPIC_API_KEY`, and
`VITE_MAPBOX_TOKEN` as Vercel environment variables before deploying.

`dist/` is checked into the repo as the last built output — regenerate with `npm run
build` after frontend changes rather than hand-editing anything under it.
