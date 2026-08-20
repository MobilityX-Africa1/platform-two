import { useMemo, useState } from 'react';
import { Search, Landmark, ShieldCheck, Globe2, Layers } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';
import { useAllocatorFilterGroups } from '../hooks/useAllocatorFilterGroups';
import { CompanyLogo } from '../components/CompanyLogo';
import { CardSkeletonGrid } from '../components/Skeletons';
import { FiltersMenu } from '../components/FiltersMenu';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { formatNumber } from '../lib/format';
import { violetShade, violetTextShade } from '../lib/assetEconomics';
import { Row } from '../components/DataTableRow';

const PAGE_SIZE = 40;

export function AllocatorsPage() {
  const { allocators, status } = useNotionData();
  const { search, setSearch, investorType, geo, instrument, focusArea, aminOnly, clearFilters } =
    useAllocatorFilterStore();
  const { groups, activeItems } = useAllocatorFilterGroups();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Header stat strip, same pattern as Companies — computed over the full
  // unfiltered set so it reads as a summary of the ecosystem, not the filter.
  const headerStats = useMemo(() => {
    if (status !== 'ready') return null;
    const aminCount = allocators.filter((a) => a.aMINMember).length;
    const marketsReached = new Set(allocators.flatMap((a) => a.geo || [])).size;
    const investorTypes = new Set(allocators.map((a) => a.typeOfInvestor).filter(Boolean)).size;
    return { aminCount, marketsReached, investorTypes };
  }, [allocators, status]);

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const filtered = allocators.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (investorType && a.typeOfInvestor !== investorType) return false;
    if (geo && !(a.geo || []).includes(geo)) return false;
    if (instrument && !(a.investmentInstrument || []).includes(instrument)) return false;
    if (focusArea && !(a.focusAreas || []).includes(focusArea)) return false;
    if (aminOnly && !a.aMINMember) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const visible = sorted.slice(0, visibleCount);
  const connectedValues = sorted.map((a) => a.connectedCompanies?.length ?? 0);
  const minConnected = Math.min(...connectedValues, 0);
  const maxConnected = Math.max(...connectedValues, 1);
  const connectedRange = maxConnected - minConnected || 1;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-header row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Capital Allocators</h1>
          <p style={{ marginTop: 8 }}>
            {sorted.length} of {allocators.length} DFIs, VCs, CVCs, grants, and debt providers mapped to the ecosystem.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="search-box" style={{ margin: 0, width: 220 }}>
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search allocators…"
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
          <MetricCard label="Allocators tracked" value={formatNumber(allocators.length)} icon={Landmark} accent="plum" />
          <MetricCard label="AMIN members" value={formatNumber(headerStats.aminCount)} icon={ShieldCheck} accent="coral" />
          <MetricCard label="Markets reached" value={formatNumber(headerStats.marketsReached)} icon={Globe2} accent="sky" />
          <MetricCard label="Investor types" value={formatNumber(headerStats.investorTypes)} icon={Layers} accent="leaf" />
        </MetricGrid>
      )}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Allocator</th>
              <th>Markets</th>
              <th>Connected companies</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const connected = a.connectedCompanies?.length ?? 0;
              const barWidth = Math.max(0, (connected / maxConnected) * 56);
              const t = (connected - minConnected) / connectedRange;
              const shade = violetShade(t);
              const textShade = violetTextShade(t);
              return (
                <Row key={a.id} to={`/allocator/${a.id}`}>
                  <td className="data-table-name">
                    <CompanyLogo name={a.name} website={a.website} size={24} />
                    <span>{a.name}</span>
                    {a.aMINMember && <span className="chip chip-upstream">AMIN</span>}
                  </td>
                  <td className="muted">
                    {(a.geo || []).slice(0, 2).join(', ')}
                    {(a.geo || []).length > 2 ? ` +${a.geo.length - 2}` : ''}
                  </td>
                  <td className="data-table-num-cell">
                    <span className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                      <span className="data-table-bar-track">
                        <span className="data-table-bar-fill" style={{ width: `${barWidth}px`, background: shade }} />
                      </span>
                      <span style={{ fontWeight: 700, minWidth: 78, textAlign: 'right', color: connected ? textShade : 'var(--muted)' }}>
                        {connected} {connected === 1 ? 'company' : 'companies'}
                      </span>
                    </span>
                  </td>
                </Row>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={3} className="muted" style={{ padding: 'var(--space-4)' }}>No allocators match these filters.</td></tr>
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
