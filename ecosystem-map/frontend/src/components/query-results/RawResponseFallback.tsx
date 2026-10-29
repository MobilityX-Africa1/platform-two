// Shown when the model's response didn't parse as JSON (or didn't match a
// known queryType) — a styled card instead of a blank page or a crash, and
// distinct enough from the normal answer cards that it reads as "something
// went wrong," not as a fifth query-result type.
export function RawResponseFallback({ raw, parseError }: { raw: string; parseError: string | null }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <p className="eyebrow" style={{ color: 'var(--coral-dark)', marginBottom: 8 }}>
        {parseError ? "Couldn't read that answer" : 'Unrecognized response'}
      </p>
      <p style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>
        {raw || 'No response was received.'}
      </p>
    </div>
  );
}
