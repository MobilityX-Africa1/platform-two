import { useParams, Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { RankBadge } from '../components/RankBadge';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { CardSkeletonGrid } from '../components/Skeletons';
import { Breadcrumb } from '../components/Breadcrumb';
import { Row } from '../components/DataTableRow';
import { formatUSDM, displayStage } from '../lib/format';
import { violetShade, violetTextShade } from '../lib/assetEconomics';
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

  const raisedValues = verticalCompanies.map((c) => c.totalFundingRaisedM || 0);
  const minRaisedM = Math.min(...raisedValues, 0);
  const maxRaisedM = Math.max(...raisedValues, 1);
  const raisedRangeM = maxRaisedM - minRaisedM || 1;

  return (
    <div className="stack page-stack">
      <Breadcrumb to="/companies" label="Companies" />
      <div className="page-header">
        <h1>{decoded}</h1>
        <p>
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
        {/* This page's list is in Top 50 rank order, so the funding breakdown is
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
            <thead>
              <tr>
                <th>Company</th>
                <th>Stage</th>
                <th>Country</th>
                <th>Total funding raised</th>
              </tr>
            </thead>
            <tbody>
              {verticalCompanies.map((c) => {
                const raisedM = c.totalFundingRaisedM || 0;
                const barWidth = Math.max(0, (raisedM / maxRaisedM) * 56);
                const t = (raisedM - minRaisedM) / raisedRangeM;
                return (
                  <Row key={c.id} to={`/company/${c.id}`}>
                    <td><div className="data-table-name">
                      <RankBadge rank={c.rankingOrder} reserve />
                      <CompanyLogo name={c.name} website={c.website} size={24} />
                      <span>{c.name}</span>
                    </div></td>
                    <td>{c.stage && <span className="chip chip-neutral">{displayStage(c.stage)}</span>}</td>
                    <td>
                      {c.country && (
                        <span className="row" style={{ gap: 6 }}>
                          <CountryFlag name={c.country.name} size={12} />
                          {c.country.name}
                        </span>
                      )}
                    </td>
                    <td className="data-table-num-cell">
                      <span className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                        <span className="data-table-bar-track">
                          <span className="data-table-bar-fill" style={{ width: `${barWidth}px`, background: violetShade(t) }} />
                        </span>
                        <span style={{ fontWeight: 700, minWidth: 48, textAlign: 'right', color: raisedM ? violetTextShade(t) : 'var(--muted)' }}>
                          {raisedM ? formatUSDM(raisedM) : '—'}
                        </span>
                      </span>
                    </td>
                  </Row>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
