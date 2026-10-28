import { useMemo, useState } from 'react';
import { Search, Handshake, TrendingUp, Building2, Landmark } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { DonutChart } from '../components/DonutChart';
import { RankedList } from '../components/RankedList';
import { InvestmentTimeline } from '../components/InvestmentTimeline';
import { formatUSDM } from '../lib/format';
import { jumpToSection } from '../lib/sectionJump';
import { useFilterStore } from '../store/filterStore';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';

// Deal Tracker's individual, named deal records are never shown publicly —
// only aggregates (CHANGES.md §6). Search/filters below narrow which deals
// feed these aggregate charts; they never surface a per-deal, per-company, or
// per-investor row.
export function DealsPage() {
  const { deals, status } = useNotionData();
  const [search, setSearch] = useState('');
  const [dealType, setDealType] = useState('');

  const dealTypes = useMemo(
    () => [...new Set(deals.map((d) => d.dealType).filter(Boolean))].sort(),
    [deals],
  );

  const filtered = useMemo(
    () => deals.filter((d) => {
      if (dealType && d.dealType !== dealType) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [d.dealName, d.company?.name, ...(d.allocators || []).map((a) => a.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }),
    [deals, dealType, search],
  );

  const stats = useMemo(() => {
    const totalAmountM = filtered.reduce((sum, d) => sum + (d.amountM || 0), 0);
    // The distinct records behind the two "represented" counts, kept so their
    // metric cards can open exactly those companies / investors.
    const companyIds = [...new Set(filtered.map((d) => d.company?.id).filter(Boolean))];
    const investorIds = [...new Set(filtered.flatMap((d) => (d.allocators || []).map((a) => a.id)))];
    const companiesRepresented = companyIds.length;
    const investorsRepresented = investorIds.length;

    const dealSplit = Object.values(
      filtered.reduce((acc, d) => {
        const key = d.dealType || 'Unspecified';
        if (!acc[key]) acc[key] = { dealType: key, amount: 0 };
        acc[key].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => b.amount - a.amount);

    // Undated deals are kept out of the year series (a trend line can't plot
    // a non-date — see the identical split in useStats.js) and surfaced as a
    // separate total instead.
    const datedDeals = filtered.filter((d) => d.date?.start);
    const undatedAmountM = filtered
      .filter((d) => !d.date?.start)
      .reduce((sum, d) => sum + (d.amountM || 0), 0);

    const investmentByYear = Object.values(
      datedDeals.reduce((acc, d) => {
        const year = new Date(d.date.start).getFullYear();
        if (!acc[year]) acc[year] = { year, amount: 0 };
        acc[year].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => a.year - b.year);

    const investmentByRegion = Object.values(
      filtered.reduce((acc, d) => {
        const region = d.company?.country?.region || 'Unspecified';
        if (!acc[region]) acc[region] = { region, amount: 0 };
        acc[region].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => b.amount - a.amount);

    return {
      totalAmountM,
      companiesRepresented,
      investorsRepresented,
      companyIds,
      investorIds,
      dealSplit,
      investmentByYear,
      undatedAmountM,
      investmentByRegion,
    };
  }, [filtered]);

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  // Describes the current deal selection for the filter chip shown on the
  // destination list, so it's clear why that list is narrowed.
  const selectionLabel = `In ${filtered.length} tracked deal${filtered.length === 1 ? '' : 's'}${dealType ? ` (${dealType})` : ''}${search ? ` matching “${search}”` : ''}`;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-header">
        <h1>Deals Tracked</h1>
        <p style={{ marginTop: 8 }}>
          {filtered.length} of {deals.length} funding rounds recorded across the ecosystem — shown as aggregates only.
        </p>
      </div>

      <MetricGrid>
        <MetricCard
          label="Deals tracked"
          value={filtered.length}
          icon={Handshake}
          accent="plum"
          onClick={() => jumpToSection('deals-split')}
          actionHint="jump to the deal split by type"
        />
        <MetricCard
          label="Total amount tracked"
          value={formatUSDM(stats.totalAmountM)}
          icon={TrendingUp}
          accent="leaf"
          onClick={() => jumpToSection('deals-by-year')}
          actionHint="jump to investment by year"
        />
        <MetricCard
          label="Companies represented"
          value={stats.companiesRepresented}
          icon={Building2}
          accent="sky"
          to="/companies"
          onClick={() => useFilterStore.getState().showOnly({ idSet: { ids: stats.companyIds, label: selectionLabel } })}
          actionHint="list these companies"
        />
        <MetricCard
          label="Investors represented"
          value={stats.investorsRepresented}
          icon={Landmark}
          accent="coral"
          to="/allocators"
          onClick={() => useAllocatorFilterStore.getState().showOnly({ idSet: { ids: stats.investorIds, label: selectionLabel } })}
          actionHint="list these investors"
        />
      </MetricGrid>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box search-box--toolbar" style={{ margin: 0, width: 260 }}>
          <Search size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by deal, company, or investor…"
            aria-label="Filter deals by deal, company, or investor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`filter-chip${dealType === '' ? ' selected' : ''}`}
          aria-pressed={dealType === ''}
          onClick={() => setDealType('')}
        >
          All types
        </button>
        {dealTypes.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip${dealType === t ? ' selected' : ''}`}
            aria-pressed={dealType === t}
            onClick={() => setDealType(t === dealType ? '' : t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: 16 }}>No deals match these filters.</p>
      ) : (
        <div className="dashboard-top-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="dashboard-top-grid-cell">
            <h2 className="section-title" id="deals-split">Deal split by type</h2>
            <div className="card" style={{ padding: stats.dealSplit.length <= 3 ? '16px 20px' : '4px 20px' }}>
              {stats.dealSplit.length <= 3 ? (
                <DonutChart
                  segments={stats.dealSplit.map((d) => ({ label: d.dealType, value: d.amount }))}
                  centerValue={formatUSDM(stats.totalAmountM)}
                  centerLabel="tracked"
                  legendSuffix={(v) => formatUSDM(v)}
                />
              ) : (
                <RankedList
                  items={stats.dealSplit.map((d) => ({ label: d.dealType, value: d.amount }))}
                  formatValue={formatUSDM}
                />
              )}
            </div>
          </div>

          <div className="dashboard-top-grid-cell">
            <h2 className="section-title">Investment by region</h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Same treatment as the Dashboard's region card: the unmapped
                  bucket is set apart as a footnote, not ranked as a region. */}
              <RankedList
                items={stats.investmentByRegion
                  .filter((r) => r.region !== 'Unspecified')
                  .map((r) => ({ label: r.region, value: r.amount }))}
                formatValue={formatUSDM}
                footnote={(() => {
                  const unmapped = stats.investmentByRegion.find((r) => r.region === 'Unspecified');
                  return unmapped ? { label: 'Unspecified (unmapped)', value: unmapped.amount } : null;
                })()}
              />
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 && stats.investmentByYear.length > 0 && (
        <div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title" id="deals-by-year">Investment by year</h2>
            {stats.undatedAmountM > 0 && (
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                + {formatUSDM(stats.undatedAmountM)} with no date on record
              </span>
            )}
          </div>
          <div className="card" style={{ padding: '20px 24px 12px' }}>
            <InvestmentTimeline data={stats.investmentByYear} formatValue={formatUSDM} />
          </div>
        </div>
      )}
    </div>
  );
}
