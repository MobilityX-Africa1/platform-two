import { create } from 'zustand';

export const useQueryStore = create((set) => ({
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
      set({
        loading: false,
        result: { type: 'answer', title: text, payload: { answer: data.answer, toolCalls: data.toolCalls } },
      });
    } catch (err) {
      set({
        loading: false,
        result: { type: 'error', title: text, payload: { message: err.message } },
      });
    }
  },

  clear: () => set({ queryText: '', result: null, loading: false }),
}));
