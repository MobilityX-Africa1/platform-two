import Anthropic from '@anthropic-ai/sdk';
import { searchNotion, queryDatabase, getPageContent } from './_lib/notionTools.js';

// Give the agentic loop (Notion round-trips + several Claude turns) more
// room than the 10s serverless default.
export const config = { maxDuration: 60 };

const MODEL = 'claude-opus-5';
const MAX_TOOL_CALLS = 8;

const SYSTEM_PROMPT = `You are the AI assistant embedded in MobilityX's ecosystem map, a platform tracking Africa's mobility sector. You answer questions by searching and reading a connected Notion workspace — you have no built-in knowledge of its contents, so always look things up.

The workspace is organized around 3 streams, 8 verticals, and 32 sub-verticals, and contains these databases:
- Countries
- Companies Pipeline
- Capital Allocators
- Deal Tracker
- Assessment Records (Top 50)
- Assessment Records

Tool strategy:
- Start with search_notion to find the right page or database ID for the question.
- Use query_database to read structured rows (companies, deals, allocators, countries), optionally with a Notion filter object.
- Use get_page_content to read the full text of a specific page (e.g. a company's detail page or a report).
- Chain tools as needed — search, then drill into what you found — rather than guessing IDs.

Grounding rules:
- Base your answer only on what the tools return. If you can't find something after searching, say so in a "caveats" note rather than guessing.
- Every company or allocator row returned by query_database carries its Notion page "id" — always carry that id through into your final answer's "id" field so the app can link to that record's own page. Never invent an id and never omit one you actually have.
- If rows are excluded from a count for a data-quality reason (missing relation, unpublished record, ambiguous match), say so as a caveat instead of silently dropping them from the total.
- Note explicitly (in a company's "status" field or as a caveat) when a company in your result is closed down, acquired, or otherwise inactive — don't just fold that into a paragraph.

Response format — this is the most important rule:
Once you are done gathering information and are ready to give your final answer (i.e. not calling a tool), respond with ONLY valid JSON matching one of the schemas below — selected by the "queryType" that best fits the question. Do not include markdown formatting, prose explanations outside the JSON, or code fences. Do not wrap the JSON in \`\`\`json or any other delimiter — the raw response body must be valid, parseable JSON and nothing else.

1. "company_list" — for questions asking to list/filter/group companies (e.g. "which companies operate in Kenya?"):
{
  "queryType": "company_list",
  "summary": "43 companies found in Kenya, grouped by category",
  "totalCount": 43,
  "groups": [
    {
      "label": "Top 50 / Ranked Cohort",
      "companies": [
        { "name": "BasiGo", "vertical": "EV Assets Hardware", "rank": 1, "fundingRaised": "$50.5m", "note": "Electric buses + Pay-As-You-Drive", "status": "active", "id": "notion-page-id" }
      ]
    }
  ],
  "caveats": ["7 companies operating in Kenya have no Location relation set and are excluded from this count"]
}

2. "investment_summary" — for questions about capital raised/deployed (e.g. "investment in EV Asset Hardware"):
{
  "queryType": "investment_summary",
  "summary": "$182.4m raised across 26 deals in EV Asset Hardware since 2021",
  "totalUSD": "$182.4m",
  "dealCount": 26,
  "byYear": [{ "year": "2024", "totalUSD": "$61.2m", "dealCount": 9 }],
  "byCountry": [{ "country": "Kenya", "totalUSD": "$74.0m", "dealCount": 11 }],
  "caveats": []
}

3. "country_comparison" — for questions comparing two or more countries:
{
  "queryType": "country_comparison",
  "summary": "Kenya leads on company count; Nigeria leads on total funding raised",
  "countries": [
    { "name": "Kenya", "stats": [{ "label": "Companies tracked", "value": "43" }, { "label": "Total funding raised", "value": "$210m" }] }
  ],
  "caveats": []
}

4. "single_metric" — for a single number/fact question (e.g. "how many companies in Nigeria?"):
{
  "queryType": "single_metric",
  "summary": "18 companies are tracked in Nigeria",
  "value": "18",
  "label": "Companies tracked in Nigeria",
  "context": "Includes 2 in early due diligence, not yet published",
  "caveats": []
}

Every field shown above is required in your output, even when empty — use "" for an unknown optional string, null for an unknown optional number, or [] for an empty list. Never add fields not in the schema, and never omit "caveats" (send [] when there is nothing to flag).`;

// Mirrors the schemas documented in SYSTEM_PROMPT — enforced structurally via
// output_config.format so a malformed/prose response becomes the rare
// exception (refusal, truncation) rather than the norm. additionalProperties
// must be false on every object per the structured-outputs contract, so
// "flexible" bags of data (per-year/per-country/per-country-stat breakdowns)
// are modelled as arrays of {label,value}-shaped rows instead of open maps.
const companySchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    vertical: { type: ['string', 'null'] },
    rank: { type: ['number', 'null'] },
    fundingRaised: { type: ['string', 'null'] },
    note: { type: ['string', 'null'] },
    status: { type: ['string', 'null'] },
    id: { type: ['string', 'null'] },
  },
  required: ['name', 'vertical', 'rank', 'fundingRaised', 'note', 'status', 'id'],
  additionalProperties: false,
};

const companyListSchema = {
  type: 'object',
  properties: {
    queryType: { type: 'string', enum: ['company_list'] },
    summary: { type: 'string' },
    totalCount: { type: 'number' },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          companies: { type: 'array', items: companySchema },
        },
        required: ['label', 'companies'],
        additionalProperties: false,
      },
    },
    caveats: { type: 'array', items: { type: 'string' } },
  },
  required: ['queryType', 'summary', 'totalCount', 'groups', 'caveats'],
  additionalProperties: false,
};

const investmentSummarySchema = {
  type: 'object',
  properties: {
    queryType: { type: 'string', enum: ['investment_summary'] },
    summary: { type: 'string' },
    totalUSD: { type: 'string' },
    dealCount: { type: 'number' },
    byYear: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          year: { type: 'string' },
          totalUSD: { type: 'string' },
          dealCount: { type: 'number' },
        },
        required: ['year', 'totalUSD', 'dealCount'],
        additionalProperties: false,
      },
    },
    byCountry: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          country: { type: 'string' },
          totalUSD: { type: 'string' },
          dealCount: { type: 'number' },
        },
        required: ['country', 'totalUSD', 'dealCount'],
        additionalProperties: false,
      },
    },
    caveats: { type: 'array', items: { type: 'string' } },
  },
  required: ['queryType', 'summary', 'totalUSD', 'dealCount', 'byYear', 'byCountry', 'caveats'],
  additionalProperties: false,
};

const countryComparisonSchema = {
  type: 'object',
  properties: {
    queryType: { type: 'string', enum: ['country_comparison'] },
    summary: { type: 'string' },
    countries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          stats: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, value: { type: 'string' } },
              required: ['label', 'value'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'stats'],
        additionalProperties: false,
      },
    },
    caveats: { type: 'array', items: { type: 'string' } },
  },
  required: ['queryType', 'summary', 'countries', 'caveats'],
  additionalProperties: false,
};

const singleMetricSchema = {
  type: 'object',
  properties: {
    queryType: { type: 'string', enum: ['single_metric'] },
    summary: { type: 'string' },
    value: { type: 'string' },
    label: { type: 'string' },
    context: { type: ['string', 'null'] },
    caveats: { type: 'array', items: { type: 'string' } },
  },
  required: ['queryType', 'summary', 'value', 'label', 'context', 'caveats'],
  additionalProperties: false,
};

const RESPONSE_SCHEMA = {
  anyOf: [companyListSchema, investmentSummarySchema, countryComparisonSchema, singleMetricSchema],
};

const FINALIZE_INSTRUCTION =
  'Give your final answer now, as ONLY valid JSON matching one of the schemas described in the system prompt — no markdown, no prose outside the JSON, no code fences.';

const tools = [
  {
    name: 'search_notion',
    description:
      "Search the connected Notion workspace by keyword. Returns matching pages and databases with their IDs, titles, and object type ('page' or 'database'). Use this first, before query_database or get_page_content, to find the right ID to drill into.",
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms — e.g. a company name, country, vertical, or page title.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_database',
    description:
      'Query a Notion database by ID to get its rows and properties (e.g. all companies in a country, all deals for an investor). Use the database ID returned by search_notion. Returns up to 500 rows.',
    input_schema: {
      type: 'object',
      properties: {
        database_id: {
          type: 'string',
          description: 'The Notion database ID, from search_notion results.',
        },
        filters: {
          type: 'object',
          description:
            'Optional Notion API filter object (see Notion API filter syntax) to narrow results, e.g. { "property": "Country", "select": { "equals": "Kenya" } }. Omit to fetch all rows.',
        },
      },
      required: ['database_id'],
    },
  },
  {
    name: 'get_page_content',
    description:
      'Fetch the full text content of a single Notion page by ID, including nested blocks (headings, lists, sub-pages). Use this to read the body of a specific page found via search_notion or a row from query_database.',
    input_schema: {
      type: 'object',
      properties: {
        page_id: {
          type: 'string',
          description: 'The Notion page ID.',
        },
      },
      required: ['page_id'],
    },
  },
];

async function executeTool(name, input) {
  console.log(`[chat] tool_use: ${name}(${JSON.stringify(input)})`);
  switch (name) {
    case 'search_notion':
      return await searchNotion(input);
    case 'query_database':
      return await queryDatabase(input);
    case 'get_page_content':
      return await getPageContent(input);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function firstText(content) {
  return content.find((block) => block.type === 'text')?.text ?? '';
}

// Makes one extra, tools-free call once the gathering loop is done, with
// output_config.format enforcing the JSON schema structurally — the system
// prompt instruction covers *content* (which queryType, what to put in each
// field), this covers *shape* (guaranteed-parseable JSON), so a malformed
// response should only happen on a refusal or a max_tokens truncation.
async function finalizeStructuredAnswer(anthropic, messages) {
  const finalizeMessages = [...messages, { role: 'user', content: FINALIZE_INSTRUCTION }];
  return anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    messages: finalizeMessages,
  });
}

// Single response contract for both the happy path and the malformed-JSON
// fallback: `result`/`queryType` are set on success, `raw` is always set so
// the frontend can show a raw-response card instead of crashing when
// `result` is null. Malformed responses are logged server-side (Vercel
// function logs) so a queryType that's prone to breaking schema can be
// spotted and the prompt adjusted.
function sendStructured(res, response, toolCalls, capped = false) {
  const raw = firstText(response.content);
  let result = null;
  let parseError = null;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    parseError = err.message;
  }
  if (!result && response.stop_reason === 'refusal') {
    parseError = parseError || 'Model refused to answer';
  }
  if (parseError) {
    console.error('[chat] malformed structured response', {
      toolCalls,
      capped,
      stopReason: response.stop_reason,
      parseError,
      raw,
    });
  }
  return res.status(200).json({
    queryType: result?.queryType ?? null,
    result,
    raw,
    parseError,
    toolCalls,
    capped,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  const { question } = req.body || {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Missing "question" string in request body' });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages = [{ role: 'user', content: question }];

  try {
    for (let turn = 0; turn < MAX_TOOL_CALLS; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        const finalResponse = await finalizeStructuredAnswer(anthropic, messages);
        return sendStructured(res, finalResponse, turn);
      }

      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');
      const toolResults = [];
      for (const block of toolUseBlocks) {
        try {
          const result = await executeTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          console.error(`[chat] tool_error: ${block.name}`, err);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err.message}`,
            is_error: true,
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    }

    // Hit the tool-call cap — ask for a final answer from what's gathered
    // so far instead of just cutting the user off.
    console.warn(`[chat] hit MAX_TOOL_CALLS (${MAX_TOOL_CALLS}) — requesting final answer`);
    messages.push({
      role: 'user',
      content: 'You have reached the maximum number of tool calls for this question. Answer now using only the information already gathered, and note in "caveats" that the search was cut short.',
    });
    const finalResponse = await finalizeStructuredAnswer(anthropic, messages);
    return sendStructured(res, finalResponse, MAX_TOOL_CALLS, true);
  } catch (err) {
    console.error('[chat] error', err);
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
