import { useParams, Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { RankBadge } from '../components/RankBadge';
import { CardSkeletonGrid } from '../components/Skeletons';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatUSDM, displayStage } from '../lib/format';

export function VerticalPage() {
  const { name } = useParams();
  const { companies, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const decoded = decodeURIComponent(name);
  const verticalCompanies = companies
    .filter((c) => (c.vertical || []).includes(decoded))
    .sort((a, b) => (a.rankingOrder ?? 999) - (b.rankingOrder ?? 999));

  const totalRaised = verticalCompanies.reduce((s, c) => s + (c.totalFundingRaisedM || 0), 0);
  const countriesRepresented = [
    ...new Map(
      verticalCompanies.filter((c) => c.country).map((c) => [c.country.id, c.country]),
    ).values(),
  ];

  return (
    <div className="stack" style={{ gap: 32 }}>
      <Breadcrumb to="/companies" label="Companies" />
      <div className="page-header">
        <h1>{decoded}</h1>
        <p style={{ marginTop: 8 }}>
          {verticalCompanies.length} of {companies.length} companies tracked in this vertical.
        </p>
      </div>

      <MetricGrid>
        <MetricCard label="Companies" value={verticalCompanies.length} />
        <MetricCard label="Total raised" value={formatUSDM(totalRaised)} />
        <MetricCard label="Countries" value={countriesRepresented.length} />
      </MetricGrid>

      <section>
        <h2 className="section-title">Countries represented</h2>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {countriesRepresented.map((c) => (
            <Link key={c.id} to={`/country/${c.id}`} className="chip chip-neutral">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Companies</h2>
        <div className="card stack" style={{ padding: 8, gap: 0 }}>
          {verticalCompanies.map((c) => (
            <Link key={c.id} to={`/company/${c.id}`} className="list-row">
              <RankBadge rank={c.rankingOrder} />
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              {c.stage && (
                <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                  {displayStage(c.stage)}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
