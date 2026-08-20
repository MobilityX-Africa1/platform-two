import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { Breadcrumb } from '../components/Breadcrumb';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { formatUSD } from '../lib/format';

const MARKET_COMPANIES_PREVIEW = 24;

function ChipList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {items.map((i) => (
        <span key={i} className="chip chip-neutral">
          {i}
        </span>
      ))}
    </div>
  );
}

export function AllocatorPage() {
  const { id } = useParams();
  const { allocators, status } = useNotionData();
  const [showAllMarketCompanies, setShowAllMarketCompanies] = useState(false);

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const allocator = allocators.find((a) => a.id === id);
  if (!allocator) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <p>Capital allocator not found.</p>
        <Breadcrumb to="/allocators" label="Capital Allocators" />
      </div>
    );
  }

  const marketCompanies = allocator.marketCompanies || [];
  const visibleMarketCompanies = showAllMarketCompanies
    ? marketCompanies
    : marketCompanies.slice(0, MARKET_COMPANIES_PREVIEW);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Breadcrumb to="/allocators" label="Capital Allocators" />
      <div className="row page-header" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <CompanyLogo name={allocator.name} website={allocator.website} size={44} />
        <h1>{allocator.name}</h1>
        <span className="chip chip-neutral">{allocator.typeOfInvestor}</span>
        {allocator.aMINMember && <span className="chip chip-upstream">AMIN member</span>}
        {!allocator.aMINMember && allocator.joinAfricanMobilityInvestmentSyndication && (
          <span className="chip chip-downstream">Open to AMIN syndication</span>
        )}
      </div>

      <div style={{ marginTop: -24 }}>
        {allocator.organisationSummary && <p style={{ marginTop: 0 }}>{allocator.organisationSummary}</p>}
        <p style={{ marginTop: 8 }}>
          {allocator.typicalInvestmentSizeUSD != null &&
            `Typical ticket: ${formatUSD(allocator.typicalInvestmentSizeUSD)}`}
          {allocator.website && (
            <>
              {allocator.typicalInvestmentSizeUSD != null && ' · '}
              <a
                href={allocator.website}
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
      </div>

      <MetricGrid>
        <MetricCard label="Portfolio companies" value={allocator.portfolio?.length ?? 0} />
      </MetricGrid>

      <section>
        <h2 className="section-title">Geographic focus</h2>
        <ChipList items={allocator.geo} />
        {(!allocator.geo || allocator.geo.length === 0) && <p className="muted">Not recorded yet.</p>}
      </section>

      {(allocator.investmentInstrument || []).length > 0 && (
        <section>
          <h2 className="section-title">Investment instrument</h2>
          <ChipList items={allocator.investmentInstrument} />
        </section>
      )}

      {(allocator.focusAreas || []).length > 0 && (
        <section>
          <h2 className="section-title">Focus areas</h2>
          <ChipList items={allocator.focusAreas} />
        </section>
      )}

      {(allocator.mobilitySubVertical || []).length > 0 && (
        <section>
          <h2 className="section-title">Mobility sub-verticals</h2>
          <ChipList items={allocator.mobilitySubVertical} />
        </section>
      )}

      {(allocator.markets || []).length > 0 && (
        <section>
          <h2 className="section-title">Active markets</h2>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {allocator.markets.map((c) => (
              <Link
                key={c.id}
                to={`/country/${c.id}`}
                className="chip chip-neutral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CountryFlag name={c.name} size={12} />
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {marketCompanies.length > 0 && (
        <section>
          <h2 className="section-title">Companies in active markets</h2>
          <p className="muted" style={{ marginTop: -12, marginBottom: 12 }}>
            Companies headquartered in a market {allocator.name} is active in — not necessarily
            companies this allocator has invested in.
          </p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {visibleMarketCompanies.map((c) => (
              <Link key={c.id} to={`/company/${c.id}`} className="chip chip-neutral">
                {c.name}
              </Link>
            ))}
          </div>
          {marketCompanies.length > MARKET_COMPANIES_PREVIEW && (
            <button
              type="button"
              className="filter-chip"
              style={{ marginTop: 12 }}
              onClick={() => setShowAllMarketCompanies((v) => !v)}
            >
              {showAllMarketCompanies
                ? 'Show fewer'
                : `Show all ${marketCompanies.length} companies`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
