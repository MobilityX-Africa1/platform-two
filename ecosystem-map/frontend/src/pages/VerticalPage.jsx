import { useParams, Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { RankBadge } from '../components/RankBadge';
import { CardSkeletonGrid } from '../components/Skeletons';
import { Breadcrumb } from '../components/Breadcrumb';
import { Row } from '../components/DataTableRow';
import { formatUSDM, displayStage } from '../lib/format';
import { jumpToSection } from '../lib/sectionJump';
import { useFilterStore } from '../store/filterStore';

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
    <div className="stack" style={{ gap: 24 }}>
      <Breadcrumb to="/companies" label="Companies" />
      <div className="page-header">
        <h1>{decoded}</h1>
        <p style={{ marginTop: 8 }}>
          {verticalCompanies.length} of {companies.length} companies tracked in this vertical.
        </p>
      </div>

      <MetricGrid>
        <MetricCard
          label="Companies"
          value={verticalCompanies.length}
          onClick={() => jumpToSection('vertical-companies')}
          actionHint="jump to this vertical's companies"
        />
        {/* This page's list has no funding column, so the funding breakdown is
            the Companies list narrowed to this vertical, highest raise first. */}
        <MetricCard
          label="Total raised"
          value={formatUSDM(totalRaised)}
          to="/companies"
          onClick={() => useFilterStore.getState().showOnly({ vertical: decoded }, 'funding')}
          actionHint="list this vertical's companies by funding raised"
        />
        <MetricCard
          label="Countries"
          value={countriesRepresented.length}
          onClick={() => jumpToSection('vertical-countries')}
          actionHint="jump to the countries represented"
        />
      </MetricGrid>

      <section>
        <h2 className="section-title" id="vertical-countries">Countries represented</h2>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {countriesRepresented.map((c) => (
            <Link key={c.id} to={`/country/${c.id}`} className="chip chip-neutral">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title" id="vertical-companies">Companies</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <tbody>
              {verticalCompanies.map((c) => (
                <Row key={c.id} to={`/company/${c.id}`}>
                  <td><div className="data-table-name">
                    <RankBadge rank={c.rankingOrder} />
                    <span>{c.name}</span>
                  </div></td>
                  <td className="data-table-chip-cell">
                    {c.stage && <span className="chip chip-neutral">{displayStage(c.stage)}</span>}
                  </td>
                </Row>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
