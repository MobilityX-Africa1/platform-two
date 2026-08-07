import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';

export function AIQueryBox() {
  const [text, setText] = useState('');
  const { run, loading } = useQuery();

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    run(text);
  }

  return (
    <div className="ai-query-box">
      <div className="ai-query-label">
        <Sparkles size={14} /> Ask EcoMap
      </div>
      <form className="ai-query-form" onSubmit={handleSubmit}>
        <input
          className="ai-query-input"
          placeholder="e.g. which companies in Kenya are currently fundraising?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="ai-query-submit" aria-label="Run query" disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}
