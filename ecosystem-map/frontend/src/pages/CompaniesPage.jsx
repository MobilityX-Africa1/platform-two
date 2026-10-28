import { useMemo, useState } from 'react';
import { Search, Building2, Globe2, TrendingUp, Layers } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { useFilterStore } from '../store/filterStore';
import { useCompanyFilterGroups } from '../hooks/useCompanyFilterGroups';
import { RankBadge } from '../components/RankBadge';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { CardSkeletonGrid } from '../components/Skeletons';
import { FiltersMenu } from '../components/FiltersMenu';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { Row } from '../components/DataTableRow';
import { displayStage, formatUSDM, formatNumber } from '../lib/format';
import { violetShade, violetTextShade } from '../lib/assetEconomics';
import { jumpToSection } from '../lib/sectionJump';

const PAGE_SIZE = 40;

export function CompaniesPage() {
  const { companies, status } = useNotionData();
  const {
    search, setSearch, vertical, stage, country, region, evAssetTag, idSet, sortBy, setSortBy, showOnly, clearFilters,
  } = useFilterStore();
  const { groups, activeItems } = useCompanyFilterGroups();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Header stat strip — same at-a-glance framing as the Dashboard's KPI row,
  // computed once over the full unfiltered set so it reads as "the whole
  // ecosystem," not a count that jumps around as filters are applied.
  const headerStats = useMemo(() => {
    if (status !== 'ready') return null;
    const countriesRepresented = new Set(companies.filter((c) => c.country).map((c) => c.country.id)).size;
    const totalRaisedM = companies.reduce((sum, c) => sum + (c.totalFundingRaisedM || 0), 0);
    const verticalCounts = companies.reduce((acc, c) => {
      for (const v of c.vertical?.length ? c.vertical : []) acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    const topVertical = Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])[0];
    return { countriesRepresented, totalRaisedM, topVertical };
  }, [companies, status]);

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const idFilter = idSet ? new Set(idSet.ids) : null;
  const filtered = companies.filter((c) => {
    if (idFilter && !idFilter.has(c.id)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (vertical && !(c.vertical || []).includes(vertical)) return false;
    if (stage && c.stage !== stage) return false;
    if (country && c.country?.id !== country) return false;
    if (region && c.country?.region !== region) return false;
    if (evAssetTag && !(c.eVAssetTags || []).includes(evAssetTag)) return false;
    return true;
  });

  const byRank = (a, b) => (a.rankingOrder ?? 999) - (b.rankingOrder ?? 999);
  const sorted = [...filtered].sort(
    sortBy === 'funding'
      ? (a, b) => (b.totalFundingRaisedM || 0) - (a.totalFundingRaisedM || 0) || byRank(a, b)
      : byRank,
  );

  // Metric-card actions: each resets this page to exactly the records the
  // card summarises (the header stats are computed over the unfiltered set),
  // then jumps to the table.
  const showAll = (nextSort = 'rank') => {
    showOnly({}, nextSort);
    setVisibleCount(PAGE_SIZE);
    jumpToSection('companies-table');
  };
  const visible = sorted.slice(0, visibleCount);
  const raisedValues = sorted.map((c) => c.totalFundingRaisedM || 0);
  const minRaisedM = Math.min(...raisedValues, 0);
  const maxRaisedM = Math.max(...raisedValues, 1);
  const raisedRangeM = maxRaisedM - minRaisedM || 1;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-header row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Companies</h1>
          <p style={{ marginTop: 8 }}>
            {sorted.length} of {companies.length} e-mobility operators, OEMs, and tech companies tracked.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="search-box search-box--toolbar" style={{ margin: 0, width: 220 }}>
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search companies…"
              aria-label="Search companies"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
          <FiltersMenu groups={groups} activeItems={activeItems} onClearAll={clearFilters} />
        </div>
      </div>

      {headerStats && (
        <MetricGrid className="metric-grid-compact">
          <MetricCard
            label="Companies tracked"
            value={formatNumber(companies.length)}
            icon={Building2}
            accent="plum"
            onClick={() => showAll()}
            actionHint="show all companies"
          />
          <MetricCard
            label="Countries represented"
            value={formatNumber(headerStats.countriesRepresented)}
            icon={Globe2}
            accent="plum"
            to="/countries"
            actionHint="open the countries breakdown"
          />
          <MetricCard
            label="Total funding raised"
            value={formatUSDM(headerStats.totalRaisedM)}
            icon={TrendingUp}
            accent="plum"
            onClick={() => showAll('funding')}
            actionHint="list all companies by funding raised"
          />
          {headerStats.topVertical && (
            <MetricCard
              label="Leading vertical"
              value={headerStats.topVertical[0]}
              delta={`${formatNumber(headerStats.topVertical[1])} companies`}
              icon={Layers}
              accent="plum"
              to={`/vertical/${encodeURIComponent(headerStats.topVertical[0])}`}
              actionHint="open this vertical"
            />
          )}
        </MetricGrid>
      )}

      <div className="data-table-wrap" id="companies-table">
        <table className="data-table">
          <thead>
            <tr>
              <th aria-sort={sortBy === 'rank' ? 'ascending' : 'none'}>
                <button type="button" className="th-sort" onClick={() => setSortBy('rank')}>
                  Company<span className="visually-hidden">, sort by Top 50 rank</span>
                  {sortBy === 'rank' && <span aria-hidden="true"> ↑</span>}
                </button>
              </th>
              <th>Vertical</th>
              <th>Stage</th>
              <th>Country</th>
              <th aria-sort={sortBy === 'funding' ? 'descending' : 'none'}>
                <button type="button" className="th-sort" onClick={() => setSortBy('funding')}>
                  Total funding raised<span className="visually-hidden">, sort highest first</span>
                  {sortBy === 'funding' && <span aria-hidden="true"> ↓</span>}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const raisedM = c.totalFundingRaisedM || 0;
              const barWidth = Math.max(0, (raisedM / maxRaisedM) * 56);
              const t = (raisedM - minRaisedM) / raisedRangeM;
              const shade = violetShade(t);
              const textShade = violetTextShade(t);
              return (
                <Row key={c.id} to={`/company/${c.id}`}>
                  <td><div className="data-table-name">
                    <RankBadge rank={c.rankingOrder} />
                    <CompanyLogo name={c.name} website={c.website} size={24} />
                    <span>{c.name}</span>
                  </div></td>
                  <td>
                    {(c.vertical || []).length > 0 && (
                      <span className="row" style={{ gap: 4 }}>
                        <span className="chip chip-neutral">{c.vertical[0]}</span>
                        {c.vertical.length > 1 && (
                          <span className="muted" style={{ fontSize: 12 }}>+{c.vertical.length - 1}</span>
                        )}
                      </span>
                    )}
                  </td>
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
                        <span className="data-table-bar-fill" style={{ width: `${barWidth}px`, background: shade }} />
                      </span>
                      <span style={{ fontWeight: 700, minWidth: 48, textAlign: 'right', color: raisedM ? textShade : 'var(--muted)' }}>
                        {raisedM ? formatUSDM(raisedM) : '—'}
                      </span>
                    </span>
                  </td>
                </Row>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ padding: 'var(--space-4)' }}>No companies match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > visibleCount && (
        <button
          type="button"
          className="filter-chip"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        >
          Show more ({sorted.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
