import { X, Loader2 } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';

export function QueryResultCard() {
  const { result, loading, clear } = useQuery();
  if (!result && !loading) return null;

  return (
    <div className="card card-raised" style={{ padding: 24, marginBottom: 32 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h3>{loading ? 'Thinking…' : result.title}</h3>
        <button type="button" onClick={clear} aria-label="Dismiss result" className="refresh-btn">
          <X size={16} />
        </button>
      </div>

      {loading && (
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Loader2 size={16} className="spin" />
          <span className="muted">Searching Notion…</span>
        </div>
      )}

      {!loading && result.type === 'answer' && (
        <div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{result.payload.answer}</p>
          <p className="eyebrow" style={{ marginTop: 16 }}>
            {result.payload.toolCalls} Notion lookup{result.payload.toolCalls === 1 ? '' : 's'} · live from Notion
          </p>
        </div>
      )}

      {!loading && result.type === 'error' && (
        <p style={{ color: 'var(--danger, #d33)' }}>
          Couldn't get an answer: {result.payload.message}
        </p>
      )}
    </div>
  );
}
