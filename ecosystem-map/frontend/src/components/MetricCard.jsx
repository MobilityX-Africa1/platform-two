import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Sparkline } from './Sparkline';

const ACCENT_CLASS = {
  plum: 'metric-card-icon--plum',
  sky: 'metric-card-icon--sky',
  leaf: 'metric-card-icon--leaf',
  coral: 'metric-card-icon--coral',
};

const ACCENT_FILL_CLASS = {
  plum: 'metric-card-progress-fill--plum',
  sky: 'metric-card-progress-fill--sky',
  leaf: 'metric-card-progress-fill--leaf',
  coral: 'metric-card-progress-fill--coral',
};

// `delta`/`sparkline` are optional — omit both when there's no real
// historical data to back them rather than rendering a fake trend.
// `deltaTrend` is 'up' | 'down' | 'flat'; 'flat' drops the arrow and the
// gain/loss colour for a period with no change.
// `to` is optional — when given, the whole tile becomes a link to the page
// that tile's metric is drilling into. `icon`/`accent` are optional — pages
// that don't have a natural per-metric icon (Asset Economics, Vertical) can
// omit them and get the plain label/value/delta layout as before. `progress`
// is optional too — a 0–1 fraction that renders a filled bar under the
// value, for metrics that are themselves "X out of a max" (e.g. a score
// pillar out of its point cap) rather than a standalone number.
export function MetricCard({ label, value, delta, deltaTrend = 'up', sparkline, progress, to, icon: Icon, accent = 'plum', valueClassName }) {
  const hasTrend = sparkline && sparkline.length >= 2;
  const Tag = to ? Link : 'div';
  return (
    <Tag {...(to ? { to } : {})} className={`card metric-card${to ? ' metric-card-link' : ''}`}>
      <div className="metric-card-head">
        <span className="metric-label">{label}</span>
        {Icon && (
          <span className={`metric-card-icon ${ACCENT_CLASS[accent] || ACCENT_CLASS.plum}`}>
            <Icon size={12} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div className="metric-card-top">
        <div className="metric-card-text">
          <span className={`metric-value${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</span>
          {delta && (
            <span className={`metric-delta-pill metric-delta-pill--${deltaTrend}`}>
              {deltaTrend === 'down' && <ArrowDownRight size={11} strokeWidth={2.5} />}
              {deltaTrend === 'up' && <ArrowUpRight size={11} strokeWidth={2.5} />}
              {delta}
            </span>
          )}
        </div>
        {hasTrend && <Sparkline data={sparkline} />}
      </div>
      {progress != null && (
        <div className="metric-card-progress-track">
          <span
            className={`metric-card-progress-fill ${ACCENT_FILL_CLASS[accent] || ACCENT_FILL_CLASS.plum}`}
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      )}
    </Tag>
  );
}

export function MetricGrid({ children, className }) {
  return <div className={`metric-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}
