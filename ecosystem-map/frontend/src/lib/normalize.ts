import type { DateValue } from '../types/records';

// The subset of Notion's property payloads this app reads. Anything else
// Notion sends (people, files, status, ...) falls through to null in
// propValue()'s default branch.
type RichText = { plain_text: string }[];

type FormulaValue =
  | { type: 'string'; string: string | null }
  | { type: 'number'; number: number | null }
  | { type: 'boolean'; boolean: boolean | null }
  | { type: 'date'; date: DateValue | null };

export type NotionProperty =
  | { type: 'title'; title: RichText }
  | { type: 'rich_text'; rich_text: RichText }
  | { type: 'number'; number: number | null }
  | { type: 'select'; select: { name: string } | null }
  | { type: 'multi_select'; multi_select: { name: string }[] }
  | { type: 'relation'; relation: { id: string }[] }
  | { type: 'checkbox'; checkbox: boolean }
  | { type: 'url'; url: string | null }
  | { type: 'date'; date: DateValue | null }
  | { type: 'formula'; formula: FormulaValue | null }
  | {
      type: 'rollup';
      rollup:
        | { type: 'number'; number: number | null }
        | { type: 'array'; array: NotionProperty[] }
        | null;
    };

export interface NotionPage {
  id: string;
  last_edited_time?: string;
  properties: Record<string, NotionProperty>;
}

export type NotionValue = string | number | boolean | DateValue | null | NotionValue[];

/**
 * One flattened Notion row, before dataStore cross-links it into a typed
 * record (see types/records.ts). Keys are the camelCased property labels.
 */
export interface NormalizedRecord {
  id: string;
  lastEditedTime: string | undefined;
  name: string;
  /** Keys whose value is a relation (id array), for resolveRelations(). */
  _relationKeys: string[];
  [key: string]: unknown;
}

function richTextToPlain(arr: RichText | undefined): string {
  return (arr || []).map((t) => t.plain_text).join('');
}

// Some Notion rows carry an internal "not ready for publish" flag inline in
// the text itself (e.g. "MOCK — ...", "PLACEHOLDER — no data yet", "No
// verified deals tracked — mock placeholder") rather than leaving the field
// blank. Treating that text as real content would surface it verbatim on the
// public site, so it's normalized to null here — the same as an empty field
// — everywhere this data is read from.
const PLACEHOLDER_PATTERN = /^\s*(mock|placeholder)\b|mock placeholder/i;

function richTextToPlainOrNull(arr: RichText): string | null {
  const text = richTextToPlain(arr);
  return PLACEHOLDER_PATTERN.test(text) ? null : text;
}

export function toCamel(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

function propValue(prop: NotionProperty): NotionValue {
  switch (prop.type) {
    case 'title':
      return richTextToPlain(prop.title);
    case 'rich_text':
      return richTextToPlainOrNull(prop.rich_text);
    case 'number':
      return prop.number;
    case 'select':
      return prop.select ? prop.select.name : null;
    case 'multi_select':
      return prop.multi_select.map((o) => o.name);
    case 'relation':
      return prop.relation.map((r) => r.id);
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url;
    case 'date':
      return prop.date ? { start: prop.date.start, end: prop.date.end } : null;
    case 'formula':
      if (!prop.formula) return null;
      switch (prop.formula.type) {
        case 'string': return prop.formula.string;
        case 'number': return prop.formula.number;
        case 'boolean': return prop.formula.boolean;
        case 'date': return prop.formula.date;
        default: return null;
      }
    case 'rollup':
      if (!prop.rollup) return null;
      if (prop.rollup.type === 'number') return prop.rollup.number;
      if (prop.rollup.type === 'array') return prop.rollup.array.map((p) => propValue(p));
      return null;
    default:
      return null;
  }
}

/**
 * Flattens one Notion page into { id, name, <camelCased props>... }.
 * Relation-type property keys are recorded in `_relationKeys` so callers
 * (dataStore) can resolve id arrays into object references without
 * confusing them with multi_select string arrays.
 */
export function normalizePage(page: NotionPage): NormalizedRecord {
  const record: NormalizedRecord = {
    id: page.id,
    lastEditedTime: page.last_edited_time,
    name: '',
    _relationKeys: [],
  };
  let titleKey: string | null = null;

  for (const [label, prop] of Object.entries(page.properties)) {
    const key = toCamel(label);
    record[key] = propValue(prop);
    if (prop.type === 'relation') record._relationKeys.push(key);
    if (prop.type === 'title') titleKey = key;
  }

  record.name = titleKey ? (record[titleKey] as string) : '';
  return record;
}

export function normalizeAll(pages: NotionPage[]): NormalizedRecord[] {
  return pages.map(normalizePage);
}

// Looks up a normalized record's value by the exact Notion property label
// (e.g. "Annual Savings EV vs ICE USD"), so callers never have to
// hand-transcribe the camelCase key normalizePage() derived from it.
// TypeScript callers should prefer the typed key on the record itself
// (econ.annualSavingsEVVsICEUSD), which the compiler checks; this lookup
// can't be checked, so it returns `any` for the untyped .jsx pages.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getField(record: object, label: string): any {
  return (record as Record<string, unknown>)[toCamel(label)];
}
