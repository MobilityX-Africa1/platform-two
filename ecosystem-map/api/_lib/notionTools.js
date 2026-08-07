import { Client, APIResponseError } from '@notionhq/client';

// Files under api/_lib/ are not treated as routes by Vercel (leading
// underscore excludes the directory from file-system routing), so this
// module is safe to import from api/chat.js without becoming its own
// serverless endpoint.

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

function isRateLimited(err) {
  return err instanceof APIResponseError
    ? err.code === 'rate_limited' || err.status === 429
    : err?.status === 429;
}

// Notion's 429s carry a `retry-after` (seconds) header; @notionhq/client
// exposes response headers inconsistently across versions, so fall back to
// exponential backoff whenever the header isn't readable off the error.
async function withRetry(fn, label) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRateLimited(err) || attempt >= MAX_RETRIES) throw err;
      const retryAfter = Number(err?.headers?.get?.('retry-after') ?? err?.headers?.['retry-after']);
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : BASE_DELAY_MS * 2 ** attempt;
      console.warn(`[notion] ${label} rate-limited — retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function extractTitle(item) {
  if (item.object === 'database') {
    return (item.title || []).map((t) => t.plain_text).join('') || 'Untitled database';
  }
  const props = item.properties || {};
  for (const prop of Object.values(props)) {
    if (prop.type === 'title') {
      return (prop.title || []).map((t) => t.plain_text).join('') || 'Untitled';
    }
  }
  return 'Untitled';
}

export async function searchNotion({ query }) {
  if (!query || typeof query !== 'string') throw new Error('query is required');

  const response = await withRetry(
    () => notion.search({ query, page_size: 10 }),
    'search_notion',
  );

  return {
    result_count: response.results.length,
    results: response.results.map((item) => ({
      id: item.id,
      object: item.object, // 'page' | 'database'
      title: extractTitle(item),
      url: item.url,
      last_edited_time: item.last_edited_time,
    })),
  };
}

function simplifyProperty(prop) {
  switch (prop.type) {
    case 'title':
      return (prop.title || []).map((t) => t.plain_text).join('');
    case 'rich_text':
      return (prop.rich_text || []).map((t) => t.plain_text).join('');
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name ?? null;
    case 'multi_select':
      return (prop.multi_select || []).map((s) => s.name);
    case 'status':
      return prop.status?.name ?? null;
    case 'date':
      return prop.date ?? null;
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    case 'people':
      return (prop.people || []).map((p) => p.name || p.id);
    case 'relation':
      return (prop.relation || []).map((r) => r.id);
    case 'formula':
      return prop.formula?.[prop.formula.type] ?? null;
    case 'rollup':
      return prop.rollup?.type ? prop.rollup[prop.rollup.type] : null;
    default:
      return prop[prop.type] ?? null;
  }
}

function simplifyPage(page) {
  const row = { id: page.id, url: page.url };
  for (const [label, prop] of Object.entries(page.properties || {})) {
    row[label] = simplifyProperty(prop);
  }
  return row;
}

// Bounded to a handful of pages (up to 500 rows) so one tool call can't
// balloon into an unbounded fetch/loop cost inside the agent loop.
const MAX_QUERY_PAGES = 5;

export async function queryDatabase({ database_id, filters }) {
  if (!database_id || typeof database_id !== 'string') {
    throw new Error('database_id is required');
  }

  const rows = [];
  let cursor;
  let pageCount = 0;
  let truncated = false;

  do {
    const response = await withRetry(
      () => notion.databases.query({
        database_id,
        filter: filters || undefined,
        start_cursor: cursor,
        page_size: 100,
      }),
      'query_database',
    );
    rows.push(...response.results.map(simplifyPage));
    cursor = response.has_more ? response.next_cursor : undefined;
    pageCount++;
    if (cursor && pageCount >= MAX_QUERY_PAGES) {
      truncated = true;
      break;
    }
  } while (cursor);

  return { row_count: rows.length, truncated, rows };
}

function blockToText(block) {
  const data = block[block.type];
  if (!data) return '';

  if (Array.isArray(data.rich_text)) {
    const text = data.rich_text.map((t) => t.plain_text).join('');
    if (!text) return '';
    switch (block.type) {
      case 'heading_1': return `# ${text}`;
      case 'heading_2': return `## ${text}`;
      case 'heading_3': return `### ${text}`;
      case 'bulleted_list_item': return `- ${text}`;
      case 'numbered_list_item': return `1. ${text}`;
      case 'to_do': return `[${data.checked ? 'x' : ' '}] ${text}`;
      case 'quote': return `> ${text}`;
      case 'callout': return `> ${text}`;
      case 'code': return '```\n' + text + '\n```';
      default: return text;
    }
  }
  if (block.type === 'child_page') return `[Sub-page: ${data.title}]`;
  if (block.type === 'child_database') return `[Sub-database: ${data.title}]`;
  return '';
}

// Bounded so a page with deeply nested or very long content can't blow up
// latency/cost inside a single tool call.
const MAX_BLOCKS = 500;
const MAX_DEPTH = 6;

export async function getPageContent({ page_id }) {
  if (!page_id || typeof page_id !== 'string') throw new Error('page_id is required');

  let blockCount = 0;

  async function fetchBlocks(blockId, depth) {
    const lines = [];
    if (depth > MAX_DEPTH) return lines;
    let cursor;
    do {
      if (blockCount >= MAX_BLOCKS) break;
      const response = await withRetry(
        () => notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 }),
        'get_page_content',
      );
      for (const block of response.results) {
        if (blockCount >= MAX_BLOCKS) break;
        blockCount++;
        const text = blockToText(block);
        if (text) lines.push(text);
        if (block.has_children) {
          const childLines = await fetchBlocks(block.id, depth + 1);
          lines.push(...childLines.map((l) => `  ${l}`));
        }
      }
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);
    return lines;
  }

  const lines = await fetchBlocks(page_id, 0);
  return {
    page_id,
    truncated: blockCount >= MAX_BLOCKS,
    content: lines.join('\n') || '(no content found on this page)',
  };
}
