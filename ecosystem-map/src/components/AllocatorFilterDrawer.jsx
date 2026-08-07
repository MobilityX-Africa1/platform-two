import { X } from 'lucide-react';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';
import { AllocatorFilterPanel } from './AllocatorFilterPanel';

export function AllocatorFilterDrawer() {
  const drawerOpen = useAllocatorFilterStore((s) => s.drawerOpen);
  const closeDrawer = useAllocatorFilterStore((s) => s.closeDrawer);
  const clearFilters = useAllocatorFilterStore((s) => s.clearFilters);
  const hasActive = useAllocatorFilterStore(
    (s) => Boolean(s.investorType || s.geo || s.instrument || s.focusArea || s.aminOnly),
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
          <AllocatorFilterPanel />
        </div>
      </div>
    </div>
  );
}
