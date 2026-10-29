import { create } from 'zustand';
import { parseQueryResult } from '../types/query';
import type { QueryResult } from '../types/query';

export interface AnswerPayload {
  /** Null when the model's response didn't match a known shape — see `raw`. */
  result: QueryResult | null;
  raw: string;
  parseError: string | null;
  toolCalls: number;
  capped: boolean;
}

export type QueryOutcome =
  | { type: 'answer'; title: string; payload: AnswerPayload }
  | { type: 'error'; title: string; payload: { message: string } };

interface QueryState {
  queryText: string;
  result: QueryOutcome | null;
  loading: boolean;
  run: (text: string) => Promise<void>;
  clear: () => void;
}

export const useQueryStore = create<QueryState>()((set) => ({
  queryText: '',
  result: null,
  loading: false,

  run: async (text) => {
    set({ queryText: text, loading: true, result: null });
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const result = parseQueryResult(data.result);
      set({
        loading: false,
        result: {
          type: 'answer',
          title: text,
          payload: {
            result,
            raw: data.raw ?? '',
            // JSON that parsed but didn't fit its queryType's shape counts as
            // unreadable too, so it gets the same fallback card.
            parseError: data.parseError
              ?? (data.result && !result ? "Response didn't match the expected answer format" : null),
            toolCalls: data.toolCalls,
            capped: data.capped,
          },
        },
      });
    } catch (err) {
      set({
        loading: false,
        result: {
          type: 'error',
          title: text,
          payload: { message: err instanceof Error ? err.message : String(err) },
        },
      });
    }
  },

  clear: () => set({ queryText: '', result: null, loading: false }),
}));
