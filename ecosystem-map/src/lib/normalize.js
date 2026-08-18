function richTextToPlain(arr) {
  return (arr || []).map((t) => t.plain_text).join('');
}

// Some Notion rows carry an internal "not ready for publish" flag inline in
// the text itself (e.g. "MOCK — ...", "PLACEHOLDER — no data yet", "No
// verified deals tracked — mock placeholder") rather than leaving the field
// blank. Treating that text as real content would surface it verbatim on the
// public site, so it's normalized to null here — the same as an empty field
// — everywhere this data is read from.
const PLACEHOLDER_PATTERN = /^\s*(mock|placeholder)\b|mock placeholder/i;

function richTextToPlainOrNull(arr) {
  const text = richTextToPlain(arr);
  return PLACEHOLDER_PATTERN.test(text) ? null : text;
}

export function toCamel(label) {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

function propValue(prop) {
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
      return prop.formula ? propValue({ type: prop.formula.type, ...prop.formula }) : null;
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
 * (useNotionData) can resolve id arrays into object references without
 * confusing them with multi_select string arrays.
 */
export function normalizePage(page) {
  const record = { id: page.id, lastEditedTime: page.last_edited_time };
  const relationKeys = [];
  let titleKey = null;

  for (const [label, prop] of Object.entries(page.properties)) {
    const key = toCamel(label);
    record[key] = propValue(prop);
    if (prop.type === 'relation') relationKeys.push(key);
    if (prop.type === 'title') titleKey = key;
  }

  record.name = titleKey ? record[titleKey] : '';
  record._relationKeys = relationKeys;
  return record;
}

export function normalizeAll(pages) {
  return pages.map(normalizePage);
}

// Looks up a normalized record's value by the exact Notion property label
// (e.g. "Annual Savings EV vs ICE USD"), so callers never have to
// hand-transcribe the camelCase key normalizePage() derived from it.
export function getField(record, label) {
  return record[toCamel(label)];
}
