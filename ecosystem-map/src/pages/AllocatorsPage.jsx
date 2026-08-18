import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';
import { CompanyLogo } from '../components/CompanyLogo';
import { CardSkeletonGrid } from '../components/Skeletons';
import { AllocatorFilterDrawer } from '../components/AllocatorFilterDrawer';

const PAGE_SIZE = 40;

export function AllocatorsPage() {
  const { allocators, status } = useNotionData();
  const { search, setSearch, investorType, geo, instrument, focusArea, aminOnly, openDrawer } =
    useAllocatorFilterStore();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const activeCount = [investorType, geo, instrument, focusArea].filter(Boolean).length +
    (aminOnly ? 1 : 0);

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

  return (
    <div className="stack" style={{ gap: 32 }}>
      <AllocatorFilterDrawer />
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
          <button
            type="button"
            className={`filter-chip filters-trigger${activeCount ? ' active' : ''}`}
            onClick={openDrawer}
          >
            <span className="row" style={{ gap: 6 }}>
              <SlidersHorizontal size={13} /> Filters
              {activeCount > 0 && <span className="count">{activeCount}</span>}
            </span>
          </button>
        </div>
      </div>

      <div className="card stack" style={{ padding: 8, gap: 0 }}>
        {visible.map((a) => (
          <Link key={a.id} to={`/allocator/${a.id}`} className="list-row">
            <CompanyLogo name={a.name} website={a.website} size={28} />
            <span style={{ fontWeight: 600 }}>{a.name}</span>
            <span className="chip chip-neutral">{a.typeOfInvestor}</span>
            {a.aMINMember && <span className="chip chip-upstream">AMIN</span>}
            <span className="muted" style={{ fontSize: 13 }}>
              {(a.geo || []).slice(0, 2).join(', ')}
              {(a.geo || []).length > 2 ? ` +${a.geo.length - 2}` : ''}
            </span>
            <span className="num muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
              {a.connectedCompanies?.length ?? 0} {a.connectedCompanies?.length === 1 ? 'company' : 'companies'}
            </span>
          </Link>
        ))}
        {sorted.length === 0 && <p style={{ padding: 16 }}>No allocators match these filters.</p>}
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
