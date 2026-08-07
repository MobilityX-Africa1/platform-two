import { useParams, Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { RankBadge } from '../components/RankBadge';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { CompanyLogo } from '../components/CompanyLogo';
import { displayStage } from '../lib/format';

export function CountryPage() {
  const { id } = useParams();
  const { countries, allocators, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const country = countries.find((c) => c.id === id);
  if (!country) return <p>Country not found.</p>;

  const activeAllocators = allocators.filter((a) =>
    (a.markets || []).some((m) => m.id === country.id),
  );

  const companiesByVertical = Object.values(
    (country.companies || []).reduce((acc, c) => {
      for (const v of c.vertical?.length ? c.vertical : ['Unspecified']) {
        if (!acc[v]) acc[v] = { vertical: v, companies: [] };
        acc[v].companies.push(c);
      }
      return acc;
    }, {}),
  );

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="row page-header" style={{ gap: 12 }}>
        <CountryFlag name={country.name} size={40} />
        <div>
          <h1>{country.name}</h1>
          <span className="muted">{country.region}</span>
        </div>
      </div>

      <div className="stat-row-plain">
        <div className="stat">
          <span className="metric-label">EV penetration</span>
          <span className="metric-value">
            {country.eVPenetration != null ? `${country.eVPenetration}%` : '—'}
          </span>
        </div>
        <div className="stat">
          <span className="metric-label">Active companies</span>
          <span className="metric-value">{country.companies?.length ?? 0}</span>
        </div>
        <div className="stat">
          <span className="metric-label">Dominant vehicle</span>
          <span className="metric-value" style={{ fontSize: 'var(--text-md)' }}>
            {country.dominantVehicleCategory || '—'}
          </span>
        </div>
      </div>

      {country.importDutyStatus && (
        <section>
          <h2 className="section-title">Policy status</h2>
          <p>{country.importDutyStatus}</p>
        </section>
      )}

      {country.marketNarrative && (
        <section>
          <h2 className="section-title">Market narrative</h2>
          <p>{country.marketNarrative}</p>
        </section>
      )}

      <section>
        <h2 className="section-title">Companies by vertical</h2>
        <div className="stack" style={{ gap: 20 }}>
          {companiesByVertical.map((group) => (
            <div key={group.vertical}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {group.vertical} · {group.companies.length}
              </div>
              <div className="card stack" style={{ padding: 8, gap: 0 }}>
                {group.companies.map((c) => (
                  <Link key={c.id} to={`/company/${c.id}`} className="list-row">
                    <RankBadge rank={c.rankingOrder} />
                    <CompanyLogo name={c.name} website={c.website} size={24} />
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.stage && (
                      <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                        {displayStage(c.stage)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {companiesByVertical.length === 0 && <p>No companies tracked in this country yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title">Investors active here</h2>
        <div className="card stack" style={{ padding: 8, gap: 0 }}>
          {activeAllocators.map((a) => (
            <Link key={a.id} to={`/allocator/${a.id}`} className="list-row">
              <CompanyLogo name={a.name} website={a.website} size={28} />
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                {a.typeOfInvestor}
              </span>
            </Link>
          ))}
          {activeAllocators.length === 0 && (
            <p style={{ padding: 12 }}>No allocators mapped to this market yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
