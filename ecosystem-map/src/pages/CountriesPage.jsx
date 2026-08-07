import { Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { REGIONS } from '../lib/flags';

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

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="page-header">
        <h1>Countries</h1>
        <p style={{ marginTop: 8 }}>
          {publishedCountries.length} markets tracked across the African mobility ecosystem.
        </p>
      </div>

      <div className="stack" style={{ gap: 24 }}>
        {byRegion.map((group) => (
          <div key={group.region}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {group.region} · {group.countries.length}
            </div>
            <div className="card stack" style={{ padding: 8, gap: 0 }}>
              {group.countries.map((country) => (
                <Link key={country.id} to={`/country/${country.id}`} className="list-row">
                  <CountryFlag name={country.name} size={20} />
                  <span style={{ fontWeight: 600 }}>{country.name}</span>
                  <span className="num muted" style={{ fontSize: 13 }}>
                    {country.eVPenetration != null ? `${country.eVPenetration}% EV` : '—'}
                  </span>
                  {country.dominantVehicleCategory && (
                    <span className="chip chip-neutral">{country.dominantVehicleCategory}</span>
                  )}
                  <span className="num muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
                    {country.companies?.length ?? 0}{' '}
                    {country.companies?.length === 1 ? 'company' : 'companies'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
