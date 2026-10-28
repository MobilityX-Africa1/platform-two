import { Link } from 'react-router-dom';

// Bordered label/value tile used on the detail pages (company, country,
// allocator). Same interaction contract as MetricCard: `to` makes it a link,
// `onClick` alone makes it a button for an in-page jump, neither leaves it a
// plain static tile — used for entity attributes (population, EV
// penetration) that have no underlying records to open.
export function StatTile({ label, value, valueClassName, valueStyle, to, onClick, actionHint }) {
  const interactive = Boolean(to || onClick);
  let Tag = 'div';
  let tagProps = {};
  if (to) {
    Tag = Link;
    tagProps = { to, onClick };
  } else if (onClick) {
    Tag = 'button';
    tagProps = { type: 'button', onClick };
  }
  return (
    <Tag {...tagProps} className={`stat-tile${interactive ? ' stat-tile-link' : ''}`}>
      <span className="stat-tile-label">{label}</span>
      <span className={`stat-tile-value${valueClassName ? ` ${valueClassName}` : ''}`} style={valueStyle}>
        {value}
      </span>
      {interactive && actionHint && <span className="visually-hidden"> — {actionHint}</span>}
    </Tag>
  );
}
