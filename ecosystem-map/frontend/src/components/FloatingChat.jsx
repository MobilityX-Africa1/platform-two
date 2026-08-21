import { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';
import { GhostFace } from './GhostFace';

// A quiet, professional floating launcher for the "Ask EcoMap" AI query
// feature (same lib/useQuery the sidebar box already uses) — global so it's
// reachable from every page, not just when the sidebar happens to be open.
// The face's eyes track the cursor anywhere on the page (see GhostFace.jsx),
// the one bit of personality on an otherwise plain circular button.
export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { run, loading, result, clear } = useQuery();
  const fabRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function toggle() {
    setOpen((v) => !v);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    run(text);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <div className="floating-chat" onKeyDown={handleKeyDown}>
      {open && (
        <div className="floating-chat-panel" role="dialog" aria-label="EcoMap AI assistant" id="floating-chat-panel">
          <div className="floating-chat-panel-header">
            <span className="ai-query-label" style={{ marginBottom: 0 }}>
              <GhostFace size={16} eyeRange={2} background />
              Ask EcoMap
            </span>
            <button type="button" className="refresh-btn" onClick={handleClose} aria-label="Close chat">
              <X size={15} />
            </button>
          </div>

          <div className="floating-chat-panel-body">
            {!result && !loading && (
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                Ask about companies, countries, deals, or allocators — answered live from the ecosystem data.
              </p>
            )}
            {loading && (
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <Loader2 size={16} className="spin" />
                <span className="muted">Searching Notion…</span>
              </div>
            )}
            {!loading && result?.type === 'answer' && (
              <div>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>
                  {result.payload.result?.summary || result.payload.raw}
                </p>
                <p className="eyebrow" style={{ marginTop: 12 }}>
                  {result.payload.toolCalls} Notion lookup{result.payload.toolCalls === 1 ? '' : 's'} ·{' '}
                  {result.payload.result ? 'full breakdown on the page' : 'live from Notion'}
                </p>
              </div>
            )}
            {!loading && result?.type === 'error' && (
              <p style={{ color: 'var(--coral-dark)', fontSize: 'var(--text-sm)' }}>
                Couldn't get an answer: {result.payload.message}
              </p>
            )}
          </div>

          <form className="floating-chat-panel-footer ai-query-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ai-query-input"
              placeholder="e.g. which companies in Kenya are fundraising?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            {result ? (
              <button
                type="button"
                className="ai-query-submit"
                aria-label="Clear conversation"
                onClick={() => { clear(); setText(''); }}
              >
                <X size={15} />
              </button>
            ) : (
              <button type="submit" className="ai-query-submit" aria-label="Ask" disabled={loading}>
                {loading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              </button>
            )}
          </form>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        className="floating-chat-fab"
        onClick={toggle}
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
        aria-expanded={open}
        aria-controls="floating-chat-panel"
      >
        {open ? (
          <X size={20} />
        ) : (
          <GhostFace size={56} eyeRange={6} />
        )}
      </button>
    </div>
  );
}
