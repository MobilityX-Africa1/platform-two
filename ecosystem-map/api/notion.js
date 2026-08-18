import { DS } from '../src/lib/notionIds.js';

// naive in-memory cache — fine for serverless warm instances
const cache = new Map();
const TTL = 5 * 60 * 1000;

// Internal-only fields (founder contact info, DD notes, deal pipeline
// status, investor relationship notes, non-public country metrics) must
// never reach the client — allow-list rather than deny-list so a new
// internal field added in Notion later is excluded by default, not leaked.
const PUBLIC_FIELDS = {
  // "Location" is the current relation to Countries — this database used to
  // call it "Headquarters Country" and "Sub-vertical"/"Revenue Stage" used to
  // exist as their own properties; all three were renamed/merged in Notion,
  // so the old labels here were silently matching nothing.
  companiesPipeline: [
    'Name', 'Location', 'Vertical', 'Sub-vertical tags',
    'Business summary', 'Website', 'Stage', 'Status', 'EV Asset Tags', 'Funding tag',
    'Currently Fundraising', 'Total Funding Raised ($m)', 'Ranking order', 'Publish', 'Founded',
    'Average Score', 'Avg Business Strength', 'Avg Innovation', 'Avg Impact & Sustainability',
    'Network type', 'Station type', 'Estimated station count',
  ],
  // "Activity" is explicitly internal-only per CHANGES.md §5 ("Never show
  // publicly: Email · Activity · Notes") — do not add it back here.
  capitalAllocators: [
    'Organisation name', 'Type of investor', 'Geo', 'Focus Areas', 'Website',
    'Organisation summary', 'AMIN member', 'Investment instrument',
    'Typical investment size (USD)', 'Mobility Sub-vertical', 'Publish', 'African markets active',
    'Join African Mobility Investment Syndication',
  ],
  // GDP per capita, Total capital deployed + the rest of the Investment
  // Landscape group (Debt pricing, Dominant funding instrument, Typical
  // ticket size range, Key DFIs present, Active investors), Notable deals,
  // and Key barriers to investment are explicitly internal-only per
  // CHANGES.md §7. Regulatory body / Government ministry / Key stakeholders /
  // Key policy risk are unconfirmed with Stuart, so they're excluded too
  // until confirmed public — see CHANGES.md §7.
  countries: [
    'Name', 'Region', 'EV penetration (%)', 'Number of active companies',
    'Dominant vehicle category', 'Import duty status', 'Market narrative', 'Publish',
    'Capital city', 'Tier', 'Platform priority', 'Market maturity', 'Population (M)',
    'Urbanisation rate (%)', 'Median age', 'Mobile money penetration (%)',
    'EV policy status', 'Policy trend', 'EV incentives', 'EV targets',
    'Analysis page', 'Last updated',
    'Charging points', 'Charging standards', 'Swap stations', 'Known swap station count',
    'Interoperability standards', 'Grid reliability',
    'Petrol price', 'Fuel price (USD/L)', 'Electricity price', 'Energy price (USD/kWh)',
    'Vehicles per 1,000', 'EV fleet size (est.)',
    'Active OEMs', 'Active accelerators', 'E-mobility associations',
    'Key use cases', 'Context notes',
  ],
  // Deal Tracker's "Notes (source)" is a source-citation field for internal
  // verification only — never a public field, so it's excluded here even
  // though the rest of the deal (company/investor/type/amount/date) drives
  // the public aggregate figures on Companies, Capital, and the Dashboard.
  dealTracker: [
    'Deal Name', 'Company Name', 'Investor (MobilityX Capital Stack)',
    'Deal Type', 'Amount ($m)', 'Date',
  ],
  assetEconomics: [
    'Country', 'Country (Link)', 'Source',
    'Fuel Price USD/L', 'Fuel Price KES/L', 'Electricity Price USD/kWh', 'Electricity Price KES/kWh',
    'ICE Bike Price USD', 'EV Bike Purchase Price Excl Battery USD', 'Full Tank Range km',
    'Litres per 100km', 'kWh per 100km', 'Fuel Cost per km ICE USD', 'Cost per km EV USD',
    'Daily Fuel Cost ICE USD', 'Monthly Fuel Cost ICE USD', 'Annual Fuel Cost ICE USD',
    'Daily Electricity Cost USD', 'Monthly Electricity Cost USD', 'Annual Electricity Cost USD',
    'Annual Insurance ICE USD', 'Annual Maintenance ICE USD', 'Annual Insurance EV USD',
    'Monthly Insurance EV USD', 'Monthly Maintenance EV USD', 'Annual Maintenance EV USD',
    'Cost per Swap USD', 'Monthly Battery Swap Cost USD', 'Yearly Battery Swap Cost EV USD',
    'Total Monthly Opex EV USD', 'Total Yearly Opex EV USD', 'Total Yearly Opex ICE USD',
    'Deposit USD', 'Loan Principal USD', 'Refinancing Period Months', 'Monthly Interest Rate %',
    'Implied Annual Interest Rate %', 'Effective Annual Rate %', 'Daily Loan Refinancing Cost USD',
    'Monthly Loan Refinancing Cost USD', 'Total EV Loan Financing Cost USD', 'Financing Premium USD',
    'Total EV Bike Purchase Price Financed USD', 'Total Opex Over Financing Period USD',
    'Total TCO Over Financing Period USD', 'Year 1 TCO ICE USD', 'Year 2 TCO ICE USD',
    'Year 3 TCO ICE USD', 'Annual Savings EV vs ICE USD',
  ],
};

// Enforcement is PUBLIC_FIELDS above (allow-list, default-deny) — this list
// exists so the exclusion rules from CHANGES.md are legible in one place and
// checked at boot, not to gate anything itself. If one of these ever ends up
// in PUBLIC_FIELDS too (e.g. a careless copy-paste of a Notion field name),
// startup throws instead of silently shipping a leak.
const INTERNAL_ONLY_FIELDS = {
  companiesPipeline: [
    'Founder email', 'Founder name', 'DD Analysis', 'Investment Memo', 'Deal Notes',
    'Meeting Notes', 'Deal Status', 'Asset Financing Status', 'Investment Readiness Score', 'Notes',
  ],
  capitalAllocators: ['Activity', 'Notes'],
  countries: [
    'GDP per capita (USD)', 'Total capital deployed (est. $m)', 'Debt pricing (%)',
    'Dominant funding instrument', 'Typical ticket size range', 'Key DFIs present',
    'Active investors', 'MobilityX activity', 'Key barriers to investment', 'Notable deals',
    // Unconfirmed with Stuart — treat as internal until confirmed public (CHANGES.md §7).
    'Regulatory body', 'Government ministry', 'Key stakeholders', 'Key policy risk',
  ],
  dealTracker: ['Notes (source)'],
  assetEconomics: [],
};

for (const [entity, internalFields] of Object.entries(INTERNAL_ONLY_FIELDS)) {
  const leaked = internalFields.filter((f) => PUBLIC_FIELDS[entity]?.includes(f));
  if (leaked.length) {
    throw new Error(`PUBLIC_FIELDS.${entity} leaks internal-only field(s): ${leaked.join(', ')}`);
  }
}

function projectPublicFields(rows, entity) {
  const allowed = PUBLIC_FIELDS[entity];
  if (!allowed) return rows;
  const allowSet = new Set(allowed);
  return rows.map((row) => ({
    ...row,
    properties: Object.fromEntries(
      Object.entries(row.properties).filter(([label]) => allowSet.has(label)),
    ),
  }));
}

// The IDs in notionIds.js are data source IDs (Notion's post-2025-09
// multi-source-database model), not database page IDs. The @notionhq/client
// SDK pinned in this project (2.3.0) predates the data sources API, so we
// query the REST endpoint directly rather than bumping a major SDK version.
async function queryAll(data_source_id) {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/data_sources/${data_source_id}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
    });
    const json = await res.json();
    if (json.object === 'error') throw new Error(json.message || 'Notion API error');
    rows.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return rows;
}

export default async function handler(req, res) {
  const { entity, fresh } = req.query;    // ?entity=countries etc.
  if (!DS[entity]) return res.status(400).json({ error: 'unknown entity' });

  const hit = cache.get(entity);
  if (!fresh && hit && Date.now() - hit.t < TTL) {
    return res.status(200).json({ cached: true, results: hit.data });
  }

  try {
    const data = projectPublicFields(await queryAll(DS[entity]), entity);
    cache.set(entity, { t: Date.now(), data });
    res.status(200).json({ cached: false, results: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
