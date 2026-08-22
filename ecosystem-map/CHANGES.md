# CHANGES.md — Notion Schema Migration
## What changed in Notion, and what the app must change to match

The Notion workspace has been migrated to match **Stuart's Platform Architecture, Data Structure & Guidance Document (v1.0, July 2026)** — three pillars (Countries, Companies, Capital), correct field names, and a `Publish` gate that controls what's public. This document tells Cowork what changed and what to update in the app.

**This is a schema-compatibility update, not a rebuild.** The dual-pane shell, routing, and view structure stay. What changes is property names, option lists, and the addition of a 3-pillar framing replacing earlier "hierarchy" language, plus two additional databases beyond the original four (see §8).

---

## 1. Terminology — pillars, not hierarchy tiers

Countries → Companies → Capital are **three pillars**, described as **lenses, not tabs** — a user can start from any pillar and cross-link to the others. Update any UI copy, comments, or navigation labels that say "hierarchy" to "pillars."

Navigation flow:
```
Dashboard (headline numbers) → select a Pillar
Countries pillar → Region → Country → Country profile page
Companies pillar → filter (Vertical / Country / Asset type) → Company profile page
Capital pillar → filter (Investor type / Geography) → Investor profile page
```
Cross-links: Company profile → click an investor → jumps to Capital pillar. Country profile → click a company → jumps to Companies pillar.

---

## 2. Database names and IDs

| Name in code | Real Notion database | Data source ID |
|---|---|---|
| `countries` | Countries | `458cbe82-1f14-49f8-be80-9f4f2c9879c0` |
| `companiesPipeline` | Companies Pipeline | `29d01e8d-bfee-4163-b4cb-831976f468c3` |
| `capitalAllocators` | Capital Allocators | `234060f7-8fd0-489e-92d3-f004fe46bf2a` |
| `dealTracker` | Deal Tracker | `d6a317b8-9ddf-40e8-9f77-27623daa3527` |
| `assessmentRecords` | Assessment Records | `61180369-0a71-4b02-abb1-9e93c7430685` |
| `assetEconomics` | Asset Economics (Simon's TCO model) | `a44e96c6-974d-4902-a7f6-5f806fd633f7` |

Update `src/lib/notionIds.js`:
```js
export const DS = {
  countries:          '458cbe82-1f14-49f8-be80-9f4f2c9879c0',
  companiesPipeline:  '29d01e8d-bfee-4163-b4cb-831976f468c3',
  capitalAllocators:  '234060f7-8fd0-489e-92d3-f004fe46bf2a',
  dealTracker:         'd6a317b8-9ddf-40e8-9f77-27623daa3527',
  assessmentRecords:  '61180369-0a71-4b02-abb1-9e93c7430685',
  assetEconomics:     'a44e96c6-974d-4902-a7f6-5f806fd633f7',
};
```

---

## 3. CRITICAL — the Publish gate

**Every query for Companies and Capital Allocators must filter `Publish = "__YES__"` before displaying anything.** Countries also has a Publish field — apply the same filter there.

```js
const publishedOnly = records.filter(r => r.Publish === true);
```

Apply this filter in the data hook layer (`useNotionData.js`), not per-component, so it's impossible to accidentally render an unpublished record anywhere in the app.

---

## 4. Companies Pipeline — field changes

### Renamed / restructured
| Old field | New field | Notes |
|---|---|---|
| `Country (HQ)` (relation) | `Headquarters Country` (relation) | Same relation target (Countries), renamed |
| `Stream` | **removed** | Not part of Stuart's schema |
| `Top 50 rank` | `Ranking order` | Same meaning |
| `Vertical rank` | **removed** | Not in Stuart's spec |
| `Score (/300)` | `Average Score` + 3 pillar rollups | Business Strength, Innovation, Impact & Sustainability |
| `Investment raised (USD)` | `Total Funding Raised ($m)` | **Units changed: dollars → millions.** $618,000,000 becomes `618`. |
| `Description` + `Solution` | `Business summary` | Merged into one field |

### Vertical list — 8 correct values
```
Integrated Mobility · EV Assets Hardware · EV Asset Software · Fintech for Mobility ·
Delivery & Logistics Software · Ride Hail / Sharing · Booking Platforms · Marketplaces & Classifieds
```
The 8th vertical is **Ride Hail / Sharing**, not any earlier placeholder guess.

### New fields to render
| Field | Type | Where it shows |
|---|---|---|
| `Revenue Stage` | select (9 bands) | Company profile, financial section |
| `EV Asset Tags` | multi-select (12 options) | Badge row on company card AND profile — primary cross-filter |
| `Sub-vertical` | free text | Company profile, under Vertical |
| `Funding tag` | multi-select: Top 50 / Asset Financing / Companies we are watching | Filter `Funding tag CONTAINS "Top 50"`, sort by `Ranking order` ascending |
| `Currently Fundraising` | checkbox | Optional badge on card |
| `Average Score`, pillar scores | number | Top 50 companies only — score breakdown on profile |

### Never render (internal only)
```
Founder email · DD Analysis · Investment Memo · Deal Notes · Meeting Notes ·
Deal Status · Asset Financing Status · Investment Readiness Score
```

### Stage display rule
Stage options carry parentheticals: `"Seed ($1m–$5m)"`. **Strip for display** — show "Seed" not "Seed ($1m–$5m)":
```js
const displayStage = (stage) => stage.split(' (')[0];
```

---

## 5. Capital Allocators — field changes

### Renamed
| Old | New |
|---|---|
| `Name` | `Organisation name` |
| `African markets active` (relation) | `Geo` (multi-select, not a relation) |
| `Ticket range` (text) | `Typical investment size (USD)` (number) |
| `Verticals of focus` | `Mobility Sub-vertical` (multi-select, 7 options) |
| `Instruments` | `Investment instrument` (multi-select, new option list) |

### Type of investor — 21-option select
```
Angel Network · Asset Manager · Catalytic Funding · Commercial Bank · Corporate Foundation ·
Corporate VC · Debt · DFI · Family Office · Foundation · Fund of Funds · Grant · Impact Investor ·
MDBs · MFI · Philanthropy · Sovereign Fund · VC · Venture Studio · Concessionary · First Loss Facility
```

### New fields
`Organisation summary`, `AMIN member` (checkbox — filter "AMIN members only"), `Join African Mobility Investment Syndication`.

### Never show publicly
```
Email · Activity · Notes
```
Portfolio companies show in **aggregate only** (e.g. "12 portfolio companies") — never the individual list on the public platform.

---

## 6. Deal Tracker — field changes

| Old | New |
|---|---|
| `Deal name` | `Deal Name` — format `"Company — $Xm Round Type"` |
| `Company` | `Company Name` |
| `Allocators` | `Investor (MobilityX Capital Stack)` |
| `Amount (USD)` | `Amount ($m)` — **units changed to millions** |
| `Instrument` | `Deal Type` — values: `Equity \| Debt \| Grant \| Concessional loan \| First loss capital` |
| `Round label` | **removed** — round type lives inside the Deal Name string |
| — | `Notes (source)` (new, required) — always show the source citation |

### Public display rule — critical
**Individual deal records are never shown publicly — only aggregates.** Show on Company/Investor profiles:
- Total Funding Raised (from Companies Pipeline, already aggregated)
- Number of funding rounds (count)
- Latest round type + stage

Do NOT render a raw deal-by-deal table on any public page.

---

## 7. Countries — field changes and clarifications

### Confirmed NOT duplicates — show both, label distinctly
An earlier pass flagged these pairs as possible duplicates. **They are confirmed different, independently-sourced values, not duplicates — values genuinely differ per country, not just rounding noise.** Do not merge or delete either side of any pair:

- **`Petrol price` AND `Fuel price (USD/L)`** — two different sourced figures for fuel cost. Show both, clearly labeled (e.g. "Petrol price — sourced [date]" vs "Fuel price estimate").
- **`Electricity price` AND `Energy price (USD/kWh)`** — same situation, two distinct figures.
- **`Known swap station count` AND `Swap stations`** — different metrics entirely. `Known swap station count` = number of known battery-swap *companies*. `Swap stations` = physical station count (only populated for a few countries — show "not yet available" where null, don't hide the field).
- **`EV policy status` AND `Import duty status`** — different granularity. `EV policy status` is a broad categorical (Active/Draft/None/Unknown), complete for all 15 countries. `Import duty status` is a specific policy detail (rich text), only filled for some — show "not yet researched" where empty.

**Rule for this entire migration: never assume similarly-named fields are duplicates. If in doubt, show both and flag for a human decision rather than merging unilaterally.**

### Full public field list
```
Country name + flag · Region · Tier · Population (M) · Urbanisation rate (%) · Capital city ·
Median age · Vehicles per 1,000 · Dominant vehicle category · EV fleet size (est.) ·
Known swap station count · Swap stations · Charging points · Key use cases · EV targets ·
EV incentives · Charging standards · Policy trend · Mobile money penetration (%) ·
EV policy status · Import duty status · Petrol price · Fuel price (USD/L) ·
Electricity price · Energy price (USD/kWh) · Context notes · Market maturity · Market narrative ·
Number of active companies (auto-count from Companies pillar)
```

### Context notes field — show this
`Context notes` explains data provenance per country (e.g. "figures from Africa EV Ecosystem Country Overview, data as of [date]"). Show this near the relevant stats — it's what makes the sourced numbers trustworthy to a reader.

### Must stay internal / never shown publicly
```
GDP per capita (USD) · Total capital deployed and all Investment Landscape fields ·
Active investors · Key DFIs present · MobilityX activity · Key barriers to investment ·
Notable deals
```
**Unconfirmed — treat as internal until Stuart confirms:** Regulatory body, Government ministry, Key stakeholders, Key policy risk. These aren't explicitly listed as public in the original spec.

### All 15 priority markets
**Priority six (fullest data):** Kenya, Nigeria, Ghana, Rwanda, Morocco, Egypt
**Standard:** South Africa, Uganda, Tanzania, Ethiopia, Ivory Coast, Senegal, Tunisia
**Low-priority stubs:** Cameroon, Zimbabwe

Country selector must show all 15, grouped by 4 regions (East / West / North / Southern Africa) — there is no "Central Africa" in the final list even though it may still appear as a leftover select option; don't use it.

---

## 8. Databases beyond the original four

### Assessment Records
Feeds the `Average Score` and 3 pillar rollups on Companies Pipeline. No dedicated UI needed — the rollup numbers already appear on Company records directly.

### Asset Economics (Simon's TCO model) — NEW, not in original scope
Linked to Countries via the `Asset Economics` relation. Contains genuine per-country Total Cost of Ownership modeling comparing EV vs ICE bikes: purchase price, financing terms, running costs (electricity/fuel, maintenance, insurance, battery swap costs), and multi-year TCO comparison. **All fields in this database are public** — this is comparative economic data, not internal deal intelligence.

Key fields: EV/ICE purchase price, loan terms, cost per km, monthly/annual opex for both EV and ICE, **Annual Savings (EV vs ICE) USD** (headline number), Year 1/2/3 TCO (ICE), Total TCO Over Financing Period, Source.

See `COWORK_PAGE_REVAMP.md` §1b for the full field list and suggested page placement (a dedicated "Asset Economics" section on the Country page, with Annual Savings as a prominent callout stat).

---

## 9. Phase plan

| Phase | Scope |
|---|---|
| **Phase 1** | Dashboard + **Companies pillar**: filter UI + company profile pages |
| **Phase 2** | **Countries pillar**: country cards + full profile pages, including Asset Economics section |
| **Phase 3** | **Capital pillar**: investor directory + investor profile pages |
| **Phase 4** | **Cross-links**: company profile → investors, country profile → companies |

---

## 10. Dashboard — metric calculations

Computed fresh on load or cached max 24 hours, never stored separately:

```
Total companies      = COUNT(Companies Pipeline WHERE Publish = true)
Companies by vertical = COUNT grouped by Vertical field
Total countries       = COUNT(Countries WHERE ≥1 company has that Headquarters Country)
Total capital allocators = COUNT(Capital Allocators WHERE Publish = true)
Total investment tracked = SUM(Deal Tracker."Amount ($m)")
Investment by year    = SUM(Amount ($m)) grouped by year from Deal Tracker.Date
Investment by region  = SUM(Amount ($m)) via Company → Headquarters Country → Region
Companies by stage    = COUNT grouped by Company Stage (display-stripped, see §4)
```

---

## 11. Known minor deviations (acceptable, documented)

- **Capital Allocators → Focus Areas**: two options auto-renamed to avoid an internal naming collision — `"Fintech"` → `"Fintech Focus"`, `"Infrastructure"` → `"Infrastructure Focus"`. Functionally identical, just longer labels.
- **Deal Tracker "Blended" deals**: remapped to the closest valid Deal Type (mostly "Concessional loan") with an explanatory note in `Notes (source)`.

---

## 12. Quick checklist for Cowork

- [ ] Update `notionIds.js` with all 6 correct data source IDs (§2)
- [ ] Add `Publish = true` filter to every Companies Pipeline and Capital Allocators query, and to Countries
- [ ] Rewrite vertical constants — 8 verticals, correct 8th value (`Ride Hail / Sharing`)
- [ ] Update currency formatters — Companies and Deal Tracker amounts are in **millions**, not raw dollars
- [ ] Update relation/property names throughout (§4, §5, §6)
- [ ] Add EV Asset Tags as filter + badge component
- [ ] Strip stage parentheticals in display formatter
- [ ] Remove any raw per-deal table from public company/investor profiles — aggregates only
- [ ] Update Countries selector to show all 15 markets grouped by 4 regions (drop "Central Africa")
- [ ] **Show both fields in every "duplicate-looking" pair — never merge or delete (§7)**
- [ ] Add the Asset Economics database and build its Country-page section (§8, and see COWORK_PAGE_REVAMP.md)
- [ ] Never fetch or render the internal-only field list (§4, §5, §7)

---

## Note: AI query provider switch (unrelated to the Notion migration above)

AI query provider: Gemini (`GEMINI_API_KEY`), not Anthropic. Switched August 2026 due to an
Anthropic account billing issue; this is a permanent decision, not a temporary workaround —
don't reintroduce Anthropic/Claude references for this feature. See `backend/api/chat.js`
and README.md §2/§4.
