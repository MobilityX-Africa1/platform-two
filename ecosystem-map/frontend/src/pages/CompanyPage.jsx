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
import { Row } from '../components/DataTableRow';
import { formatDate, displayStage, formatNumber, formatUSDM } from '../lib/format';

// One of the three pillars that sum to a company's out-of-300 score. Shown as
// a slim labelled meter in the hero rail, right next to the score it composes,
// instead of as a separate lower-page section repeating the same story.
function ScorePillar({ label, full, value, max, accent }) {
  const pct = value != null ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="entity-hero-meter">
      <div className="entity-hero-meter-head">
        <span className="entity-hero-meter-label" title={full}>{label}</span>
        <span className="entity-hero-meter-value">
          {value ?? '—'}<span>&thinsp;/&thinsp;{max}</span>
        </span>
      </div>
      <span className="entity-hero-meter-track" aria-hidden="true">
        <span
          className={`entity-hero-meter-fill entity-hero-meter-fill--${accent}`}
          style={{ width: `${pct * 100}%` }}
        />
      </span>
    </div>
  );
}

function CompanyHero({ company }) {
  const isTop50 = company.averageScore != null;
  const tags = [
    ...(company.vertical || []).map((v) => ({ key: `v-${v}`, label: v, to: `/vertical/${encodeURIComponent(v)}`, cls: 'chip-neutral' })),
    ...(company.stage ? [{ key: 'stage', label: displayStage(company.stage), cls: 'chip-neutral' }] : []),
    ...(company.status ? [{ key: 'status', label: company.status, cls: 'chip-neutral' }] : []),
    ...(company.currentlyFundraising ? [{ key: 'fund', label: 'Fundraising', cls: 'chip-cross-ecosystem' }] : []),
    ...(company.subVerticalTags || []).map((t) => ({ key: `sv-${t}`, label: t, cls: 'chip-neutral' })),
  ];

  return (
    <div className={`entity-hero${isTop50 ? ' entity-hero-scored' : ''}`}>
      <div className="entity-hero-id">
        <div className="entity-hero-title-row">
          <CompanyLogo name={company.name} website={company.website} size={48} />
          <h1>{company.name}</h1>
          <RankBadge rank={company.rankingOrder} />
        </div>

        <div className="entity-hero-meta">
          {company.country && (
            <Link to={`/country/${company.country.id}`} className="entity-hero-meta-country">
              <CountryFlag name={company.country.name} size={13} />
              {company.country.name}
            </Link>
          )}
          {company.founded && (
            <>
              <span className="sep">·</span>
              <span>Founded {company.founded}</span>
            </>
          )}
          {company.website && (
            <>
              <span className="sep">·</span>
              <a className="entity-hero-meta-link" href={company.website} target="_blank" rel="noreferrer">
                Website <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
              </a>
            </>
          )}
        </div>

        {tags.length > 0 && (
          <div className="entity-hero-tags">
            {tags.map(({ key, label, to, cls }) =>
              to ? (
                <Link key={key} to={to} className={`chip ${cls}`}>{label}</Link>
              ) : (
                <span key={key} className={`chip ${cls}`}>{label}</span>
              ),
            )}
          </div>
        )}
      </div>

      {isTop50 && (
        <div className="entity-hero-score">
          <div className="entity-hero-score-badge">
            <ScoreArc value={company.averageScore} size={72} />
            <span className="eyebrow">Score / 300</span>
            {company.rankingOrder != null && (
              <span className="entity-hero-score-rank">#{company.rankingOrder} · Top 50</span>
            )}
          </div>
          <div className="entity-hero-meters">
            <ScorePillar label="Business" full="Business strength" value={company.avgBusinessStrength} max={120} accent="plum" />
            <ScorePillar label="Innovation" full="Innovation" value={company.avgInnovation} max={90} accent="sky" />
            <ScorePillar label="Impact" full="Impact & sustainability" value={company.avgImpactSustainability} max={90} accent="leaf" />
          </div>
        </div>
      )}
    </div>
  );
}

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

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Breadcrumb to="/companies" label="Companies" flush />

      <CompanyHero company={company} />

      <div className="stat-tile-grid">
        <div className="stat-tile">
          <span className="stat-tile-label">Funding rounds</span>
          <span className="stat-tile-value">{companyDeals.length}</span>
        </div>
        {company.totalFundingRaisedM != null && (
          <div className="stat-tile">
            <span className="stat-tile-label">Total funding raised</span>
            <span className="stat-tile-value accent">{formatUSDM(company.totalFundingRaisedM)}</span>
          </div>
        )}
        {company.estimatedStationCount != null && (
          <div className="stat-tile">
            <span className="stat-tile-label">Estimated stations</span>
            <span className="stat-tile-value">{formatNumber(company.estimatedStationCount)}</span>
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
        {investors.length === 0 ? (
          <p style={{ padding: 12 }}>No investors recorded yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {investors.map((a) => (
                  <Row key={a.id} to={`/allocator/${a.id}`}>
                    <td><div className="data-table-name">
                      <CompanyLogo name={a.name} website={a.website} size={28} />
                      <span>{a.name}</span>
                    </div></td>
                    <td className="data-table-chip-cell">
                      <span className="chip chip-neutral">{a.typeOfInvestor}</span>
                    </td>
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(company.marketAllocators || []).length > 0 && (
        <section>
          <h2 className="section-title">Capital allocators active in this market</h2>
          <p className="muted" style={{ marginTop: -12, marginBottom: 12 }}>
            Allocators active in {company.country?.name ?? 'this company’s market'} — not
            necessarily investors in {company.name}.
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {company.marketAllocators.map((a) => (
                  <Row key={a.id} to={`/allocator/${a.id}`}>
                    <td><div className="data-table-name">
                      <CompanyLogo name={a.name} website={a.website} size={28} />
                      <span>{a.name}</span>
                    </div></td>
                    <td className="data-table-chip-cell">
                      <span className="chip chip-neutral">{a.typeOfInvestor}</span>
                    </td>
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
