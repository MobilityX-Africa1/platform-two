import { Link } from 'react-router-dom';

// Plain name/value list — alternating row shading, tabular-numeral values,
// no bars or axes. `footnote` renders a separate muted row below a dashed
// divider for an unmapped/catch-all bucket that shouldn't rank alongside
// real categories (e.g. an "Unspecified" region dominating by sheer size).
// `linkTo(item)` is optional — when given, each row becomes a Link (e.g. the
// old "Companies by vertical" bar chart navigated to /vertical/:name on click;
// this keeps that affordance now that it's a list row instead of a bar).
export function RankedList({ items, formatValue, footnote, linkTo }) {
  const Row = linkTo ? Link : 'div';
  return (
    <div className="ranked-list">
      {items.map((item) => (
        <Row
          key={item.label}
          {...(linkTo ? { to: linkTo(item), className: 'ranked-list-row ranked-list-row-link' } : { className: 'ranked-list-row' })}
        >
          <span className="ranked-list-label">{item.label}</span>
          <span className="ranked-list-value num">{formatValue(item.value)}</span>
        </Row>
      ))}
      {footnote && (
        <>
          <div className="ranked-list-divider" />
          <div className="ranked-list-row ranked-list-footnote">
            <span className="ranked-list-label">{footnote.label}</span>
            <span className="ranked-list-value num">{formatValue(footnote.value)}</span>
          </div>
        </>
      )}
    </div>
  );
}
