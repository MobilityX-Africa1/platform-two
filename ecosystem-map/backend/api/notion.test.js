import { beforeEach, describe, expect, it, vi } from 'vitest';

// The proxy is the only thing standing between internal Notion fields and the
// public site, so these tests pin its allow-list behavior against a stubbed
// Notion API.

const title = (text) => ({ type: 'title', title: [{ plain_text: text }] });
const text = (value) => ({ type: 'rich_text', rich_text: [{ plain_text: value }] });

function companyRow(id, name) {
  return {
    object: 'page',
    id,
    properties: {
      Name: title(name),
      Website: { type: 'url', url: 'https://example.com' },
      Publish: { type: 'checkbox', checkbox: true },
      'Founder email': { type: 'email', email: 'founder@example.com' },
      'DD Analysis': text('internal diligence notes'),
      // A field added in Notion after the allow-list was written.
      'Brand new internal field': text('should never ship'),
    },
  };
}

function notionPage(results, nextCursor = null) {
  return { object: 'list', results, has_more: Boolean(nextCursor), next_cursor: nextCursor };
}

function mockResponse() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

let handler;
let fetchMock;

beforeEach(async () => {
  // Fresh module per test so the in-memory cache never leaks between tests.
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  ({ default: handler } = await import('./notion.js'));
});

async function get(query) {
  const res = mockResponse();
  await handler({ query }, res);
  return res;
}

describe('/api/notion', () => {
  it('strips internal-only fields and keeps allow-listed ones', async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => notionPage([companyRow('c1', 'BasiGo')]) });

    const res = await get({ entity: 'companiesPipeline' });

    expect(res.statusCode).toBe(200);
    const props = res.body.results[0].properties;
    expect(Object.keys(props).sort()).toEqual(['Name', 'Publish', 'Website']);
    expect(JSON.stringify(res.body)).not.toContain('founder@example.com');
    expect(JSON.stringify(res.body)).not.toContain('internal diligence notes');
  });

  it('excludes fields that are not on the allow-list by default', async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => notionPage([companyRow('c1', 'BasiGo')]) });

    const res = await get({ entity: 'companiesPipeline' });

    expect(res.body.results[0].properties).not.toHaveProperty('Brand new internal field');
  });

  it('follows pagination cursors to return every row', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => notionPage([companyRow('c1', 'A')], 'cursor-2') })
      .mockResolvedValueOnce({ json: async () => notionPage([companyRow('c2', 'B')]) });

    const res = await get({ entity: 'companiesPipeline' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).start_cursor).toBe('cursor-2');
    expect(res.body.results.map((r) => r.id)).toEqual(['c1', 'c2']);
  });

  it('serves a repeat request from cache', async () => {
    fetchMock.mockResolvedValue({ json: async () => notionPage([companyRow('c1', 'A')]) });

    await get({ entity: 'companiesPipeline' });
    const res = await get({ entity: 'companiesPipeline' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.body.cached).toBe(true);
  });

  it('rejects an unknown entity without calling Notion', async () => {
    const res = await get({ entity: 'workspaceSecrets' });

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when Notion reports an error', async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ object: 'error', message: 'Unauthorized' }) });

    const res = await get({ entity: 'countries' });

    expect(res.statusCode).toBe(500);
  });
});
