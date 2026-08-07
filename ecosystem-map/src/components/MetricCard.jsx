export function MetricCard({ label, value }) {
  return (
    <div className="card metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}

export function MetricGrid({ children }) {
  return <div className="metric-grid">{children}</div>;
}
