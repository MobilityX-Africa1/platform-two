import { CountryFlag } from '../CountryFlag';
import { CaveatsBanner } from './QueryResultShared';
import type { CountryComparisonResult as CountryComparisonResultData } from '../../types/query';

export function CountryComparisonResult({ result }: { result: CountryComparisonResultData }) {
  const { summary, countries, caveats } = result;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <p>{summary}</p>

      <div className="metric-grid">
        {countries.map((country) => (
          <div key={country.name} className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              <CountryFlag name={country.name} size={16} />
              <h3 className="section-title" style={{ margin: 0 }}>{country.name}</h3>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {country.stats.map((stat) => (
                <div key={stat.label} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                  <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{stat.label}</span>
                  <span style={{ fontWeight: 700 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <CaveatsBanner caveats={caveats} />
    </div>
  );
}
