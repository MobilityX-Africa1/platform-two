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
      <div className="tree-node">
        <NavLink to="/countries" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
          <Globe2 size={14} className="nav-icon nav-icon--sky" />
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
        <Building2 size={14} className="nav-icon nav-icon--plum" />
        <span>Companies</span>
        <span className="count">{companies.length}</span>
      </NavLink>

      <div className="tree-node">
        <NavLink to="/allocators" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
          <Landmark size={14} className="nav-icon nav-icon--leaf" />
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

      <NavLink to="/asset-economics" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
        <Coins size={14} className="nav-icon nav-icon--coral" />
        <span>Asset Economics</span>
        <span className="count">{economics.length}</span>
      </NavLink>
    </div>
  );
}
