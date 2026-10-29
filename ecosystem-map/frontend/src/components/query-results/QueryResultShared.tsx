// Shared bits used across the per-queryType result renderers (see
// QueryResultRouter.jsx).

// Data-quality notes (missing relations, cut-short searches, excluded rows)
// render as a quiet, separate note — not folded into the main answer prose,
// so they read as meta-commentary about completeness rather than part of
// the answer itself.
export function CaveatsBanner({ caveats }: { caveats: string[] }) {
  if (!caveats || caveats.length === 0) return null;
  return (
    <div className="caveat-banner">
      <span className="eyebrow">Data notes</span>
      <ul>
        {caveats.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
