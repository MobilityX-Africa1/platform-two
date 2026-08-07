import { NavLink } from 'react-router-dom';
import { Globe2, Building2, Landmark } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { TreeSkeleton } from './Skeletons';

export function HierarchyTree() {
  const { companies, countries, allocators, status } = useNotionData();

  if (status === 'loading' || status === 'idle') return <TreeSkeleton />;
  if (status === 'error') return null;

  // Countries isn't publish-gated at the store level (see dataStore.js), so
  // this count matches CountriesPage by filtering out unpublished stubs.
  const publishedCountryCount = countries.filter((c) => c.publish === true).length;

  return (
    <div className="stack" style={{ gap: 4 }}>
      <NavLink to="/countries" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
        <Globe2 size={14} />
        <span>Countries</span>
        <span className="count">{publishedCountryCount}</span>
      </NavLink>

      <NavLink to="/companies" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
        <Building2 size={14} />
        <span>Companies</span>
        <span className="count">{companies.length}</span>
      </NavLink>

      <NavLink to="/allocators" className={({ isActive }) => `tree-row${isActive ? ' active' : ''}`}>
        <Landmark size={14} />
        <span>Capital Allocators</span>
        <span className="count">{allocators.length}</span>
      </NavLink>
    </div>
  );
}
