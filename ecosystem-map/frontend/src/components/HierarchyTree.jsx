import { NavLink } from 'react-router-dom';
import { Globe2, Building2, Landmark, Coins, Handshake, GitCompare } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { TreeSkeleton } from './Skeletons';

// One nav entry. In the collapsed icon rail (`compact`) only the icon is
// drawn, so the label moves to aria-label/title to keep every link named for
// screen readers and discoverable on hover.
function NavItem({ to, icon, label, count, compact }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}
      title={compact ? label : undefined}
      aria-label={compact ? label : undefined}
    >
      {icon}
      {!compact && <span>{label}</span>}
      {!compact && count != null && <span className="count">{count}</span>}
    </NavLink>
  );
}

export function HierarchyTree({ compact = false }) {
  const { companies, countries, allocators, deals, economics, status } = useNotionData();

  if (status === 'loading' || status === 'idle') return <TreeSkeleton />;
  if (status === 'error') return null;

  // Countries isn't publish-gated at the store level (see dataStore.js), so
  // this count matches CountriesPage by filtering out unpublished stubs.
  const publishedCountryCount = countries.filter((c) => c.publish === true).length;

  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="tree-node">
        <NavItem
          to="/countries"
          icon={<Globe2 size={14} className="nav-icon nav-icon--sky" />}
          label="Countries"
          count={publishedCountryCount}
          compact={compact}
        />
        <div className="tree-children">
          <NavItem to="/compare" icon={<GitCompare size={14} />} label="Compare countries" compact={compact} />
        </div>
      </div>

      <NavItem
        to="/companies"
        icon={<Building2 size={14} className="nav-icon nav-icon--plum" />}
        label="Companies"
        count={companies.length}
        compact={compact}
      />

      <div className="tree-node">
        <NavItem
          to="/allocators"
          icon={<Landmark size={14} className="nav-icon nav-icon--leaf" />}
          label="Capital Allocators"
          count={allocators.length}
          compact={compact}
        />
        <div className="tree-children">
          <NavItem
            to="/deals"
            icon={<Handshake size={14} />}
            label="Deals Tracked"
            count={deals.length}
            compact={compact}
          />
        </div>
      </div>

      <NavItem
        to="/asset-economics"
        icon={<Coins size={14} className="nav-icon nav-icon--coral" />}
        label="Asset Economics"
        count={economics.length}
        compact={compact}
      />
    </div>
  );
}
