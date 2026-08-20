import { Row } from './DataTableRow';

// Plain name/value list — same square, zebra-striped, headerless data-table
// language as every other list in the app, just without bars or axes.
// `footnote` renders a separate muted/italic row below a dashed divider for
// an unmapped/catch-all bucket that shouldn't rank alongside real categories
// (e.g. an "Unspecified" region dominating by sheer size). `linkTo(item)` is
// optional — when given, each row navigates (e.g. "Companies by vertical"
// rows open /vertical/:name).
export function RankedList({ items, formatValue, footnote, linkTo }) {
  return (
    <table className="data-table data-table-plain">
      <tbody>
        {items.map((item) =>
          linkTo ? (
            <Row key={item.label} to={linkTo(item)}>
              <td>{item.label}</td>
              <td className="data-table-num-cell">{formatValue(item.value)}</td>
            </Row>
          ) : (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td className="data-table-num-cell">{formatValue(item.value)}</td>
            </tr>
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
