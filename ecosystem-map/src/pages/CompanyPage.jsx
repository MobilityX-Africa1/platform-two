import { useParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { RankBadge } from '../components/RankBadge';
import { EVAssetTagRow } from '../components/Badges';
import { ScoreArc } from '../components/ScoreArc';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatDate, displayStage, formatNumber, formatUSDM } from '../lib/format';

export function CompanyPage() {
  const { id } = useParams();
  const { companies, deals, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const company = companies.find((c) => c.id === id);
  if (!company) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <p>Company not found.</p>
        <Breadcrumb to="/companies" label="Companies" />
      </div>
    );
  }

  const companyDeals = deals
    .filter((d) => d.company?.id === company.id)
    .sort((a, b) => new Date(b.date?.start || 0) - new Date(a.date?.start || 0));

  const investors = [
    ...new Map(companyDeals.flatMap((d) => d.allocators).map((a) => [a.id, a])).values(),
  ];

  const isTop50 = company.averageScore != null;

  return (
    <div className="stack" style={{ gap: 32 }}>
      <Breadcrumb to="/companies" label="Companies" />
      <div className="row page-header" style={{ gap: 10 }}>
        <CompanyLogo name={company.name} website={company.website} size={44} />
        <RankBadge rank={company.rankingOrder} />
        <h1>{company.name}</h1>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: -24 }}>
        <div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {(company.vertical || []).map((v) => (
              <Link key={v} to={`/vertical/${encodeURIComponent(v)}`} className="chip chip-neutral">
                {v}
              </Link>
            ))}
            {company.stage && <span className="chip chip-neutral">{displayStage(company.stage)}</span>}
            {company.status && <span className="chip chip-neutral">{company.status}</span>}
            {company.currentlyFundraising && (
              <span className="chip chip-cross-ecosystem">Fundraising</span>
            )}
          </div>
          <p style={{ marginTop: 12 }}>
            {company.country && (
              <Link
                to={`/country/${company.country.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  color: 'var(--text-2)',
                }}
              >
                <CountryFlag name={company.country.name} size={14} />
                {company.country.name}
              </Link>
            )}
            {company.founded && ` · Founded ${company.founded}`}
            {company.website && (
              <>
                {' · '}
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--plum)', fontWeight: 600 }}
                >
                  Website{' '}
                  <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </a>
              </>
            )}
          </p>
          {(company.subVerticalTags || []).length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {company.subVerticalTags.map((t) => (
                <span key={t} className="chip chip-neutral">{t}</span>
              ))}
            </div>
          )}
        </div>

        {isTop50 && (
          <div className="card" style={{ padding: 14, textAlign: 'center', minWidth: 136, flexShrink: 0 }}>
            <ScoreArc value={company.averageScore} size={68} />
            <div className="eyebrow" style={{ marginTop: 6, fontSize: 10 }}>
              Score / 300
            </div>
            {company.rankingOrder != null && (
              <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 8 }}>
                <div>
                  <div className="metric-value" style={{ fontSize: 14 }}>
                    #{company.rankingOrder}
                  </div>
                  <div className="eyebrow" style={{ fontSize: 10 }}>Top 50</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="card metric-card" style={{ maxWidth: 220 }}>
          <span className="metric-label">Funding rounds</span>
          <span className="metric-value">{companyDeals.length}</span>
        </div>
        {company.totalFundingRaisedM != null && (
          <div className="card metric-card" style={{ maxWidth: 220 }}>
            <span className="metric-label">Total funding raised</span>
            <span className="metric-value">{formatUSDM(company.totalFundingRaisedM)}</span>
          </div>
        )}
        {company.estimatedStationCount != null && (
          <div className="card metric-card" style={{ maxWidth: 220 }}>
            <span className="metric-label">Estimated stations</span>
            <span className="metric-value">{formatNumber(company.estimatedStationCount)}</span>
          </div>
        )}
      </div>

      {(company.networkType || (company.stationType || []).length > 0) && (
        <section>
          <h2 className="section-title">Asset & network</h2>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {company.networkType && <span className="chip chip-neutral">{company.networkType} network</span>}
            {(company.stationType || []).map((t) => (
              <span key={t} className="chip chip-neutral">{t}</span>
            ))}
          </div>
        </section>
      )}

      {isTop50 && (
        <section>
          <h2 className="section-title">Score breakdown</h2>
          <div className="metric-grid">
            <div className="card metric-card">
              <span className="metric-label">Business strength</span>
              <span className="metric-value">{company.avgBusinessStrength ?? '—'}<span className="muted" style={{ fontSize: 13 }}> /120</span></span>
            </div>
            <div className="card metric-card">
              <span className="metric-label">Innovation</span>
              <span className="metric-value">{company.avgInnovation ?? '—'}<span className="muted" style={{ fontSize: 13 }}> /90</span></span>
            </div>
            <div className="card metric-card">
              <span className="metric-label">Impact &amp; sustainability</span>
              <span className="metric-value">{company.avgImpactSustainability ?? '—'}<span className="muted" style={{ fontSize: 13 }}> /90</span></span>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Business summary</h2>
        <p>{company.businessSummary}</p>
      </section>

      {(company.eVAssetTags || []).length > 0 && (
        <section>
          <h2 className="section-title">EV assets</h2>
          <EVAssetTagRow tags={company.eVAssetTags} />
        </section>
      )}

      <section>
        <h2 className="section-title">Funding history</h2>
        <div className="card" style={{ padding: 16 }}>
          {companyDeals.length === 0 ? (
            <p className="muted">No recorded funding rounds yet.</p>
          ) : (
            <p>
              {companyDeals.length} round{companyDeals.length === 1 ? '' : 's'} raised, most recently a{' '}
              <strong>{companyDeals[0].dealType}</strong> round on {formatDate(companyDeals[0].date)}.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">Investors</h2>
        <div className="card stack" style={{ padding: 8, gap: 0 }}>
          {investors.map((a) => (
            <Link key={a.id} to={`/allocator/${a.id}`} className="list-row">
              <CompanyLogo name={a.name} website={a.website} size={28} />
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                {a.typeOfInvestor}
              </span>
            </Link>
          ))}
          {investors.length === 0 && <p style={{ padding: 12 }}>No investors recorded yet.</p>}
        </div>
      </section>

      {(company.marketAllocators || []).length > 0 && (
        <section>
          <h2 className="section-title">Capital allocators active in this market</h2>
          <p className="muted" style={{ marginTop: -12, marginBottom: 12 }}>
            Allocators active in {company.country?.name ?? 'this company’s market'} — not
            necessarily investors in {company.name}.
          </p>
          <div className="card stack" style={{ padding: 8, gap: 0 }}>
            {company.marketAllocators.map((a) => (
              <Link key={a.id} to={`/allocator/${a.id}`} className="list-row">
                <CompanyLogo name={a.name} website={a.website} size={28} />
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                  {a.typeOfInvestor}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
