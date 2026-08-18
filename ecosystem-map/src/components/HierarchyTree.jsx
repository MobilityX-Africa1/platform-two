import { NavLink } from 'react-router-dom';
import { Globe2, Building2, Landmark, Coins, Handshake, GitCompare } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { TreeSkeleton } from './Skeletons';

export function HierarchyTree() {
  const { companies, countries, allocators, deals, economics, status } = useNotionData();

  if (status === 'loading' || status === 'idle') return <TreeSkeleton />;
  if (status === 'error') return null;

  // Countries isn't publish-gated at the store level (see dataStore.js), so
  // this count matches CountriesPage by filtering out unpublished stubs.
  const publishedCountryCount = countries.filter((c) => c.publish === true).length;

  return (
    <div className="stack" style={{ gap: 4 }}>
      {/* Pinned quick-access — Asset Economics is one of the platform's most
          distinctive features (per-market EV vs ICE TCO); it also lives
          nested under Countries below for data-model correctness, but stays
          reachable in one click from here regardless of pillar. */}
      <NavLink
        to="/asset-economics"
        className={({ isActive }) => `tree-row tree-row-pinned${isActive ? ' active' : ''}`}
      >
        <Coins size={14} />
        <span>Asset Economics</span>
        <span className="count">{economics.length}</span>
      </NavLink>

      <div className="tree-node">
        <NavLink to="/countries" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
          <Globe2 size={14} />
          <span>Countries</span>
          <span className="count">{publishedCountryCount}</span>
        </NavLink>
        <div className="tree-children">
          <NavLink to="/compare" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
            <GitCompare size={14} />
            <span>Compare countries</span>
          </NavLink>
        </div>
      </div>

      <NavLink to="/companies" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
        <Building2 size={14} />
        <span>Companies</span>
        <span className="count">{companies.length}</span>
      </NavLink>

      <div className="tree-node">
        <NavLink to="/allocators" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
          <Landmark size={14} />
          <span>Capital Allocators</span>
          <span className="count">{allocators.length}</span>
        </NavLink>
        <div className="tree-children">
          <NavLink to="/deals" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
            <Handshake size={14} />
            <span>Deals Tracked</span>
            <span className="count">{deals.length}</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
