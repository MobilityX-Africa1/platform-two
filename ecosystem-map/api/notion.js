import { DS } from '../src/lib/notionIds.js';

// naive in-memory cache — fine for serverless warm instances
const cache = new Map();
const TTL = 5 * 60 * 1000;

// Internal-only fields (founder contact info, DD notes, deal pipeline
// status, investor relationship notes, non-public country metrics) must
// never reach the client — allow-list rather than deny-list so a new
// internal field added in Notion later is excluded by default, not leaked.
const PUBLIC_FIELDS = {
  companiesPipeline: [
    'Name', 'Headquarters Country', 'Vertical', 'Sub-vertical', 'Sub-vertical tags',
    'Business summary', 'Website', 'Stage', 'Revenue Stage', 'EV Asset Tags', 'Funding tag',
    'Currently Fundraising', 'Total Funding Raised ($m)', 'Ranking order', 'Publish', 'Founded',
    'Average Score', 'Avg Business Strength', 'Avg Innovation', 'Avg Impact & Sustainability',
  ],
  capitalAllocators: [
    'Organisation name', 'Type of investor', 'Geo', 'Focus Areas', 'Website',
    'Organisation summary', 'AMIN member', 'Investment instrument',
    'Typical investment size (USD)', 'Mobility Sub-vertical', 'Publish', 'African markets active',
  ],
  countries: [
    'Name', 'Region', 'EV penetration (%)', 'Number of active companies',
    'Dominant vehicle category', 'Import duty status', 'Market narrative', 'Publish',
  ],
  // Deal Tracker's "Notes (source)" is a source-citation field for internal
  // verification only — never a public field, so it's excluded here even
  // though the rest of the deal (company/investor/type/amount/date) drives
  // the public aggregate figures on Companies, Capital, and the Dashboard.
  dealTracker: [
    'Deal Name', 'Company Name', 'Investor (MobilityX Capital Stack)',
    'Deal Type', 'Amount ($m)', 'Date',
  ],
};

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
