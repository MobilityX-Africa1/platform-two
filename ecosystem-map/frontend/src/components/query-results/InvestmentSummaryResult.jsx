import { TrendingUp, Handshake } from 'lucide-react';
import { CountryFlag } from '../CountryFlag';
import { MetricCard, MetricGrid } from '../MetricCard';
import { CaveatsBanner } from './QueryResultShared';

export function InvestmentSummaryResult({ result }) {
  const { summary, totalUSD, dealCount, byYear, byCountry, caveats } = result;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <p style={{ marginBottom: 12 }}>{summary}</p>
        <MetricGrid>
          <MetricCard label="Total raised" value={totalUSD} icon={TrendingUp} accent="leaf" />
          <MetricCard label="Deals" value={formatCount(dealCount)} icon={Handshake} accent="plum" />
        </MetricGrid>
      </div>

      {byYear.length > 0 && (
        <section>
          <h2 className="section-title">By year</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {byYear.map((row) => (
                  <tr key={row.year}>
                    <td className="data-table-name"><span>{row.year}</span></td>
                    <td className="muted" style={{ fontSize: 'var(--text-sm)' }}>{formatCount(row.dealCount)}</td>
                    <td className="data-table-num-cell"><span style={{ fontWeight: 700 }}>{row.totalUSD}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {byCountry.length > 0 && (
        <section>
          <h2 className="section-title">By country</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {byCountry.map((row) => (
                  <tr key={row.country}>
                    <td className="data-table-name">
                      <CountryFlag name={row.country} size={14} />
                      <span>{row.country}</span>
                    </td>
                    <td className="muted" style={{ fontSize: 'var(--text-sm)' }}>{formatCount(row.dealCount)}</td>
                    <td className="data-table-num-cell"><span style={{ fontWeight: 700 }}>{row.totalUSD}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <CaveatsBanner caveats={caveats} />
    </div>
  );
}

function formatCount(n) {
  return `${n} deal${n === 1 ? '' : 's'}`;
}
