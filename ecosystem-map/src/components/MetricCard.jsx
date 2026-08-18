import { Link } from 'react-router-dom';
import { Sparkline } from './Sparkline';

// `delta`/`sparkline` are optional — omit both when there's no real
// historical data to back them rather than rendering a fake trend.
// `to` is optional — when given, the whole tile becomes a link to the page
// that tile's metric is drilling into.
export function MetricCard({ label, value, delta, sparkline, to }) {
  const hasTrend = sparkline && sparkline.length >= 2;
  const Tag = to ? Link : 'div';
  return (
    <Tag {...(to ? { to } : {})} className={`card metric-card${to ? ' metric-card-link' : ''}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-card-top">
        <div className="metric-card-text">
          <span className="metric-value">{value}</span>
          {delta && <span className="metric-delta">{delta}</span>}
        </div>
        {hasTrend && <Sparkline data={sparkline} />}
      </div>
    </Tag>
  );
}

export function MetricGrid({ children, className }) {
  return <div className={`metric-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}
