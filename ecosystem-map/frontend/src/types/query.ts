// The chat assistant's answer shapes — one per "queryType", mirroring the
// schemas in backend/api/chat.js's SYSTEM_PROMPT. Keep the two in sync.
//
// The model is *asked* for these shapes, not guaranteed to produce them, so
// parseQueryResult() checks a response before it reaches a renderer. A
// renderer can then trust its props instead of crashing mid-render on a
// missing array.

export interface QueryCompany {
  name: string;
  vertical: string;
  rank: number | null;
  fundingRaised: string;
  note: string;
  status: string;
  /** Notion page id; empty when the model couldn't tie the row to a record. */
  id: string;
}

export interface CompanyListResult {
  queryType: 'company_list';
  summary: string;
  totalCount: number | null;
  groups: { label: string; companies: QueryCompany[] }[];
  caveats: string[];
}

export interface InvestmentRow {
  totalUSD: string;
  dealCount: number;
}

export interface InvestmentSummaryResult {
  queryType: 'investment_summary';
  summary: string;
  totalUSD: string;
  dealCount: number;
  byYear: (InvestmentRow & { year: string })[];
  byCountry: (InvestmentRow & { country: string })[];
  caveats: string[];
}

export interface CountryComparisonResult {
  queryType: 'country_comparison';
  summary: string;
  countries: { name: string; stats: { label: string; value: string }[] }[];
  caveats: string[];
}

export interface SingleMetricResult {
  queryType: 'single_metric';
  summary: string;
  value: string;
  label: string;
  context: string;
  caveats: string[];
}

export type QueryResult =
  | CompanyListResult
  | InvestmentSummaryResult
  | CountryComparisonResult
  | SingleMetricResult;

export type QueryType = QueryResult['queryType'];

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const arrayOf = (v: unknown, item: (x: unknown) => boolean) => Array.isArray(v) && v.every(item);

// Checks only what a renderer depends on structurally — the arrays it maps
// over and the strings it uses as keys/labels. Scalar values shown as text
// (a count sent as "26" rather than 26) render fine either way, so they
// aren't rejected over it.
const SHAPE_CHECKS: Record<QueryType, (r: Obj) => boolean> = {
  company_list: (r) =>
    arrayOf(r.groups, (g) => isObj(g) && isStr(g.label) && arrayOf(g.companies, (c) => isObj(c) && isStr(c.name))),
  investment_summary: (r) =>
    arrayOf(r.byYear, (y) => isObj(y) && y.year != null) &&
    arrayOf(r.byCountry, (c) => isObj(c) && isStr(c.country)),
  country_comparison: (r) =>
    arrayOf(r.countries, (c) => isObj(c) && isStr(c.name) && arrayOf(c.stats, (s) => isObj(s) && isStr(s.label))),
  single_metric: (r) => r.value != null && r.label != null,
};

/**
 * Narrows the chat endpoint's `result` to a QueryResult, or null when it
 * doesn't match the shape for its queryType (the caller then shows the raw
 * response instead). A missing `caveats` list is the one omission
 * tolerated, since it's purely supplementary.
 */
export function parseQueryResult(result: unknown): QueryResult | null {
  if (!isObj(result) || !isStr(result.queryType) || !isStr(result.summary)) return null;
  const check = SHAPE_CHECKS[result.queryType as QueryType];
  if (!check || !check(result)) return null;
  const caveats = arrayOf(result.caveats, isStr) ? result.caveats : [];
  return { ...result, caveats } as QueryResult;
}
