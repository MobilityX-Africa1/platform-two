import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { REGIONS } from '../lib/flags';
import { violetShade, violetTextShade } from '../lib/assetEconomics';
import { Row } from '../components/DataTableRow';

export function CountriesPage() {
  const { countries, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  // Countries aren't publish-gated at the store level (companies still need
  // to resolve their HQ country even when it's an unpublished stub), so this
  // page filters for its own listing instead. See dataStore.js.
  const publishedCountries = countries.filter((c) => c.publish === true);

  const byRegion = REGIONS.map((region) => ({
    region,
    countries: publishedCountries
      .filter((c) => c.region === region)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.countries.length > 0);

  // Bar scale is global (max EV penetration across all markets), not
  // per-region, so a bar's length is comparable across every region card —
  // same cross-market comparison the Asset Economics bars give.
  const evValues = publishedCountries.map((c) => c.eVPenetration || 0);
  const minEvPenetration = Math.min(...evValues, 0);
  const maxEvPenetration = Math.max(...evValues, 1);
  const evRange = maxEvPenetration - minEvPenetration || 1;

  return (
    <div className="stack page-stack">
      <div className="page-header">
        <span className="eyebrow page-eyebrow" data-pillar="countries">Countries pillar</span>
        <h1>Countries</h1>
        <p>
          {publishedCountries.length} markets tracked across the African mobility ecosystem.
        </p>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        {byRegion.map((group) => (
          <div key={group.region}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {group.region} · {group.countries.length}
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Dominant vehicle</th>
                    <th>Companies</th>
                    <th>EV penetration</th>
                  </tr>
                </thead>
                <tbody>
                  {group.countries.map((country) => {
                    const pct = country.eVPenetration;
                    const barWidth = pct == null ? 0 : Math.max(0, (pct / maxEvPenetration) * 56);
                    const t = pct == null ? 0 : (pct - minEvPenetration) / evRange;
                    const shade = violetShade(t);
                    const textShade = violetTextShade(t);
                    return (
                      <Row key={country.id} to={`/country/${country.id}`}>
                        <td><div className="data-table-name">
                          <CountryFlag name={country.name} size={18} />
                          <span>{country.name}</span>
                        </div></td>
                        <td>
                          {country.dominantVehicleCategory && (
                            <span className="chip chip-neutral">{country.dominantVehicleCategory}</span>
                          )}
                        </td>
                        <td className="muted">
                          {country.companies?.length ?? 0}{' '}
                          {country.companies?.length === 1 ? 'company' : 'companies'}
                        </td>
                        <td className="data-table-num-cell">
                          <span className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                            <span className="data-table-bar-track">
                              <span className="data-table-bar-fill" style={{ width: `${barWidth}px`, background: shade }} />
                            </span>
                            <span style={{ fontWeight: 700, minWidth: 56, textAlign: 'right', color: pct != null ? textShade : 'var(--muted)' }}>
                              {pct != null ? `${pct}% EV` : '—'}
                            </span>
                          </span>
                        </td>
                      </Row>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
