export function TreeSkeleton() {
  return (
    <div className="stack" style={{ padding: '0 12px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 32, width: `${90 - i * 6}%` }} />
      ))}
    </div>
  );
}

export function CardSkeletonGrid({ count = 4 }) {
  return (
    <div className="metric-grid">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 96 }} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="stack">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48 }} />
      ))}
    </div>
  );
}
