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

When answering:
- Base your answer only on what the tools return. If you can't find something after searching, say so plainly rather than guessing.
- Mention which records or pages you drew from so the answer is checkable.
- Keep answers focused and skip preamble.`;

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
        return res.status(200).json({ answer: firstText(response.content), toolCalls: turn });
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
      content: 'You have reached the maximum number of tool calls for this question. Answer now using only the information already gathered, and note if anything is incomplete.',
    });
    const finalResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });
    return res.status(200).json({
      answer: firstText(finalResponse.content),
      toolCalls: MAX_TOOL_CALLS,
      capped: true,
    });
  } catch (err) {
    console.error('[chat] error', err);
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
