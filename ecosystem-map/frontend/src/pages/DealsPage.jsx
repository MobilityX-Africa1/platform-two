import { useMemo, useState } from 'react';
import { Search, Handshake, TrendingUp, Building2, Landmark } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { DonutChart } from '../components/DonutChart';
import { RankedList } from '../components/RankedList';
import { InvestmentTimeline } from '../components/InvestmentTimeline';
import { formatUSDM } from '../lib/format';

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
    const companiesRepresented = new Set(filtered.map((d) => d.company?.id).filter(Boolean)).size;
    const investorsRepresented = new Set(
      filtered.flatMap((d) => (d.allocators || []).map((a) => a.id)),
    ).size;

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
      dealSplit,
      investmentByYear,
      undatedAmountM,
      investmentByRegion,
    };
  }, [filtered]);

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-header">
        <h1>Deals Tracked</h1>
        <p style={{ marginTop: 8 }}>
          {filtered.length} of {deals.length} funding rounds recorded across the ecosystem — shown as aggregates only.
        </p>
      </div>

      <MetricGrid>
        <MetricCard label="Deals tracked" value={filtered.length} icon={Handshake} accent="plum" />
        <MetricCard label="Total amount tracked" value={formatUSDM(stats.totalAmountM)} icon={TrendingUp} accent="leaf" />
        <MetricCard label="Companies represented" value={stats.companiesRepresented} icon={Building2} accent="sky" />
        <MetricCard label="Investors represented" value={stats.investorsRepresented} icon={Landmark} accent="coral" />
      </MetricGrid>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ margin: 0, width: 260 }}>
          <Search size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by deal, company, or investor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`filter-chip${dealType === '' ? ' selected' : ''}`}
          onClick={() => setDealType('')}
        >
          All types
        </button>
        {dealTypes.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip${dealType === t ? ' selected' : ''}`}
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
            <h2 className="section-title">Deal split by type</h2>
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
              <RankedList
                items={stats.investmentByRegion.map((r) => ({ label: r.region, value: r.amount }))}
                formatValue={formatUSDM}
              />
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 && stats.investmentByYear.length > 0 && (
        <div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">Investment by year</h2>
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
