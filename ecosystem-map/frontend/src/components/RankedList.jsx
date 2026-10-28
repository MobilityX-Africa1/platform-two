import { Row } from './DataTableRow';

// Ranked name/value list in the app's data-table language, with a thin
// proportional bar under each label so the ranking reads at a glance.
// Bars scale to the largest ranked item; the `footnote` row (an unmapped /
// catch-all bucket such as "Unspecified" that shouldn't rank alongside real
// categories) is excluded from that scale and drawn without a bar.
// `linkTo(item)` is optional — when given, each row navigates (e.g.
// "Companies by vertical" rows open /vertical/:name).
export function RankedList({ items, formatValue, footnote, linkTo }) {
  const max = Math.max(...items.map((i) => i.value || 0), 0) || 1;

  const cells = (item) => (
    <>
      <td>
        <span className="ranked-label">{item.label}</span>
        <span className="ranked-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(2, ((item.value || 0) / max) * 100)}%` }} />
        </span>
      </td>
      <td className="data-table-num-cell">{formatValue(item.value)}</td>
    </>
  );

  return (
    <table className="data-table data-table-plain ranked-table">
      <tbody>
        {items.map((item) =>
          linkTo ? (
            <Row key={item.label} to={linkTo(item)}>{cells(item)}</Row>
          ) : (
            <tr key={item.label}>{cells(item)}</tr>
          ),
        )}
        {footnote && (
          <tr className="data-table-footnote-row">
            <td>{footnote.label}</td>
            <td className="data-table-num-cell">{formatValue(footnote.value)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
