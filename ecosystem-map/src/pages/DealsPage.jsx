import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Search } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { formatUSDM } from '../lib/format';

const SLICE_COLORS = ['#4A2D4E', '#89CFF0', '#9BBB59', '#F4A28C'];

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

    const investmentByYear = Object.values(
      filtered.reduce((acc, d) => {
        const year = d.date?.start ? new Date(d.date.start).getFullYear() : 'Unspecified';
        if (!acc[year]) acc[year] = { year, amount: 0 };
        acc[year].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => (a.year === 'Unspecified' ? 1 : b.year === 'Unspecified' ? -1 : a.year - b.year));

    const investmentByRegion = Object.values(
      filtered.reduce((acc, d) => {
        const region = d.company?.country?.region || 'Unspecified';
        if (!acc[region]) acc[region] = { region, amount: 0 };
        acc[region].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => b.amount - a.amount);

    return { totalAmountM, companiesRepresented, investorsRepresented, dealSplit, investmentByYear, investmentByRegion };
  }, [filtered]);

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="page-header">
        <h1>Deals Tracked</h1>
        <p style={{ marginTop: 8 }}>
          {filtered.length} of {deals.length} funding rounds recorded across the ecosystem — shown as aggregates only.
        </p>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <span className="metric-label">Deals tracked</span>
          <span className="metric-value">{filtered.length}</span>
        </div>
        <div className="card metric-card">
          <span className="metric-label">Total amount tracked</span>
          <span className="metric-value">{formatUSDM(stats.totalAmountM)}</span>
        </div>
        <div className="card metric-card">
          <span className="metric-label">Companies represented</span>
          <span className="metric-value">{stats.companiesRepresented}</span>
        </div>
        <div className="card metric-card">
          <span className="metric-label">Investors represented</span>
          <span className="metric-value">{stats.investorsRepresented}</span>
        </div>
      </div>

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
        <div className="row" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 className="section-title">Deal split by type</h2>
            <div className="card" style={{ padding: 12, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.dealSplit}
                  layout="vertical"
                  margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickFormatter={(v) => formatUSDM(v)}
                    tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    dataKey="dealType"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                    {stats.dealSplit.map((entry, i) => (
                      <Cell key={entry.dealType} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 className="section-title">Investment by region</h2>
            <div className="card" style={{ padding: 12, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.investmentByRegion}
                  layout="vertical"
                  margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickFormatter={(v) => formatUSDM(v)}
                    tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    dataKey="region"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                    {stats.investmentByRegion.map((entry, i) => (
                      <Cell key={entry.region} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div>
          <h2 className="section-title">Investment by year</h2>
          <div className="card" style={{ padding: 12, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.investmentByYear}
                margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
                barCategoryGap="28%"
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  allowDecimals={false}
                  width={48}
                  tickFormatter={(v) => formatUSDM(v)}
                  tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                <Bar dataKey="amount" fill="var(--sky)" radius={[4, 4, 0, 0]} barSize={26} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
