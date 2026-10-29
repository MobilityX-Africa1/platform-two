import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { Breadcrumb } from '../components/Breadcrumb';
import { Row } from '../components/DataTableRow';
import { formatUSD } from '../lib/format';
import { StatTile } from '../components/StatTile';
import { jumpToSection } from '../lib/sectionJump';

const MARKET_COMPANIES_PREVIEW = 18;

function ChipRow({ items, render }) {
  const clean = render ? items : items.map((s) => (typeof s === 'string' ? s.trim() : s)).filter(Boolean);
  return (
    <div className="chip-row">
      {clean.map((item) =>
        render ? render(item) : (
          <span key={item} className="chip chip-neutral">{item}</span>
        ),
      )}
    </div>
  );
}

// Identity band — same self-contained hero the company page uses, so an
// allocator profile opens the same way any other detail page does: logo +
// name, a thin meta line, standing chips, then the one-line pitch.
function AllocatorHero({ allocator }) {
  const tags = [
    allocator.typeOfInvestor && { key: 'type', label: allocator.typeOfInvestor, cls: 'chip-neutral' },
    allocator.aMINMember && { key: 'amin', label: 'AMIN member', cls: 'chip-upstream' },
    !allocator.aMINMember && allocator.joinAfricanMobilityInvestmentSyndication &&
      { key: 'open', label: 'Open to AMIN syndication', cls: 'chip-downstream' },
  ].filter(Boolean);

  return (
    <div className="entity-hero">
      <div className="entity-hero-id">
        <div className="entity-hero-title-row">
          <CompanyLogo name={allocator.name} website={allocator.website} size={48} />
          <h1>{allocator.name}</h1>
        </div>

        {(allocator.typicalInvestmentSizeUSD != null || allocator.website) && (
          <div className="entity-hero-meta">
            {allocator.typicalInvestmentSizeUSD != null && (
              <span>Typical ticket: {formatUSD(allocator.typicalInvestmentSizeUSD)}</span>
            )}
            {allocator.website && (
              <>
                {allocator.typicalInvestmentSizeUSD != null && <span className="sep">·</span>}
                <a className="entity-hero-meta-link" href={allocator.website} target="_blank" rel="noreferrer">
                  Website <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
                </a>
              </>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="entity-hero-tags">
            {tags.map(({ key, label, cls }) => (
              <span key={key} className={`chip ${cls}`}>{label}</span>
            ))}
          </div>
        )}

        {allocator.organisationSummary && (
          <p className="entity-hero-summary">{allocator.organisationSummary}</p>
        )}
      </div>
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
      <div className="stack page-stack">
        <p>Capital allocator not found.</p>
        <Breadcrumb to="/allocators" label="Capital Allocators" />
      </div>
    );
  }

  const portfolio = [
    ...new Map((allocator.portfolio || []).map((c) => [c.id, c])).values(),
  ];
  const marketCompanies = allocator.marketCompanies || [];
  const visibleMarketCompanies = showAllMarketCompanies
    ? marketCompanies
    : marketCompanies.slice(0, MARKET_COMPANIES_PREVIEW);

  // `target` is the section listing that tile's records — only set when that
  // section actually renders (an empty portfolio has no section to open).
  // Deals tracked opens the portfolio, which is built from those deals.
  const tiles = [
    { label: 'Portfolio companies', value: portfolio.length, target: portfolio.length > 0 ? 'allocator-portfolio' : null, hint: 'jump to portfolio companies' },
    (allocator.markets || []).length > 0 && { label: 'Active markets', value: allocator.markets.length, target: 'allocator-profile', hint: 'jump to the investment profile' },
    marketCompanies.length > 0 && { label: 'Market companies', value: marketCompanies.length, target: 'allocator-market-companies', hint: 'jump to companies in active markets' },
    (allocator.deals || []).length > 0 && { label: 'Deals tracked', value: allocator.deals.length, target: portfolio.length > 0 ? 'allocator-portfolio' : null, hint: 'jump to the companies behind these deals' },
  ].filter(Boolean);

  // Every scalar attribute collapsed into one label → value table instead of a
  // separate headed section per field — a five-chip page shouldn't need five
  // headings.
  const profileRows = [
    { label: 'Geographic focus', items: allocator.geo },
    { label: 'Investment instrument', items: allocator.investmentInstrument },
    { label: 'Focus areas', items: allocator.focusAreas },
    { label: 'Mobility sub-verticals', items: allocator.mobilitySubVertical },
  ].filter((r) => (r.items || []).length > 0);

  const hasMarkets = (allocator.markets || []).length > 0;

  return (
    <div className="stack page-stack">
      <Breadcrumb to="/allocators" label="Capital Allocators" flush />

      <AllocatorHero allocator={allocator} />

      <div className="stat-tile-grid">
        {tiles.map((t) => (
          <StatTile
            key={t.label}
            label={t.label}
            value={t.value}
            onClick={t.target ? () => jumpToSection(t.target) : undefined}
            actionHint={t.hint}
          />
        ))}
      </div>

      {(profileRows.length > 0 || hasMarkets) && (
        <section>
          <h2 className="section-title" id="allocator-profile">Investment profile</h2>
          <div className="section-table-wrap profile-fields">
            <table className="section-table">
              <tbody>
                {profileRows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="section-table-chip-cell">
                      <ChipRow items={r.items} />
                    </td>
                  </tr>
                ))}
                {hasMarkets && (
                  <tr>
                    <td>Active markets</td>
                    <td className="section-table-chip-cell">
                      <ChipRow
                        items={allocator.markets}
                        render={(c) => (
                          <Link key={c.id} to={`/country/${c.id}`} className="chip chip-neutral">
                            <CountryFlag name={c.name} size={12} />
                            {c.name}
                          </Link>
                        )}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {portfolio.length > 0 && (
        <section>
          <h2 className="section-title" id="allocator-portfolio">Portfolio companies</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {portfolio.map((c) => (
                  <Row key={c.id} to={`/company/${c.id}`}>
                    <td><div className="data-table-name">
                      <CompanyLogo name={c.name} website={c.website} size={28} />
                      <span>{c.name}</span>
                    </div></td>
                    <td className="data-table-chip-cell">
                      {c.country && <span className="chip chip-neutral">{c.country.name}</span>}
                    </td>
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {marketCompanies.length > 0 && (
        <section>
          <h2 className="section-title" id="allocator-market-companies">Companies in active markets</h2>
          <p className="muted" style={{ marginTop: -8, marginBottom: 12, fontSize: 'var(--text-xs)' }}>
            Companies headquartered in a market {allocator.name} is active in — not necessarily
            companies this allocator has invested in.
          </p>
          <div className="chip-row">
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
