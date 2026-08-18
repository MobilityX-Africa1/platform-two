import { useNavigate } from 'react-router-dom';
import { CountryFlag } from './CountryFlag';
import { formatMoney } from '../lib/format';
import { violetShade, annualIce, annualEv, annualDelta, annualDeltaPct } from '../lib/assetEconomics';

// Compact ranked table — one row per market, sorted by the caller (annual
// cost delta descending) — that replaces the old dense per-country grid.
// Clicking/Enter-ing a row opens that market's full unit-economics page.
export function MarketComparisonTable({ markets }) {
  const navigate = useNavigate();

  const pcts = markets.map((m) => annualDeltaPct(m)).filter((v) => v != null);
  const minPct = pcts.length ? Math.min(...pcts) : 0;
  const maxPct = pcts.length ? Math.max(...pcts) : 1;
  const pctRange = maxPct - minPct || 1;

  const goTo = (id) => navigate(`/asset-economics/${id}`);

  return (
    <div className="econ-scope">
      <div className="econ-table-wrap">
        <table className="econ-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>ICE / yr</th>
              <th>EV / yr</th>
              <th>Δ annual</th>
              <th aria-hidden="true" />
              <th>Δ %</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const ice = annualIce(m);
              const ev = annualEv(m);
              const delta = annualDelta(m);
              const pct = annualDeltaPct(m);
              const shade = violetShade(pct == null ? 0 : (pct - minPct) / pctRange);
              const barWidth = pct == null || !maxPct ? 0 : Math.max(0, (pct / maxPct) * 50);

              return (
                <tr
                  key={m.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open full unit-economics breakdown for ${m.name}`}
                  onClick={() => goTo(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goTo(m.id);
                    }
                  }}
                >
                  <td className="econ-market-name">
                    <span className="row" style={{ gap: 8 }}>
                      <CountryFlag name={m.name} size={16} />
                      {m.name}
                    </span>
                  </td>
                  <td className="econ-num-cell econ-ice-cell">{formatMoney(ice)}</td>
                  <td className="econ-num-cell econ-ev-cell">{formatMoney(ev)}</td>
                  <td className="econ-num-cell">{formatMoney(delta)}</td>
                  <td className="econ-bar-cell">
                    <span className="econ-bar-track">
                      <span className="econ-bar-fill" style={{ width: `${barWidth}px`, background: shade }} />
                    </span>
                  </td>
                  <td className="econ-num-cell econ-pct-cell" style={{ color: shade }}>
                    {pct == null ? '—' : `${Math.round(pct)}%`}
                  </td>
                </tr>
              );
            })}
            {markets.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 'var(--space-4)' }}>
                  No asset economics data recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {markets.length > 0 && (
        <p className="econ-footnote">
          Sorted by annual cost delta, descending · {markets.length} of {markets.length} markets shown
          · click a row to open the full unit-economics breakdown
        </p>
      )}
    </div>
  );
}
