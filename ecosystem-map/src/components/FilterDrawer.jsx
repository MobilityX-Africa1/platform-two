import { X } from 'lucide-react';
import { useFilterStore } from '../store/filterStore';
import { FilterPanel } from './FilterPanel';

export function FilterDrawer() {
  const drawerOpen = useFilterStore((s) => s.drawerOpen);
  const closeDrawer = useFilterStore((s) => s.closeDrawer);
  const clearFilters = useFilterStore((s) => s.clearFilters);
  const hasActive = useFilterStore(
    (s) => Boolean(s.vertical || s.stage || s.evAssetTag || s.country || s.region),
  );

  if (!drawerOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={closeDrawer}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Filters
          </h2>
          <div className="row" style={{ gap: 8 }}>
            {hasActive && (
              <button type="button" className="filter-chip" onClick={clearFilters}>
                Clear
              </button>
            )}
            <button
              type="button"
              className="sidebar-toggle"
              onClick={closeDrawer}
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="drawer-body">
          <FilterPanel />
        </div>
      </div>
    </div>
  );
}
