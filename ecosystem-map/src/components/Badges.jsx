import { evAssetTagClass } from '../lib/format';

export function EVAssetTagRow({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {tags.map((t) => (
        <span key={t} className={`chip ${evAssetTagClass(t)}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

export function AMINBadge() {
  return <span className="chip chip-upstream">AMIN member</span>;
}
