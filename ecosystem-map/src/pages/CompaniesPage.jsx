import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { useFilterStore } from '../store/filterStore';
import { RankBadge } from '../components/RankBadge';
import { CompanyLogo } from '../components/CompanyLogo';
import { CountryFlag } from '../components/CountryFlag';
import { CardSkeletonGrid } from '../components/Skeletons';
import { FilterDrawer } from '../components/FilterDrawer';
import { displayStage } from '../lib/format';

export function CompaniesPage() {
  const { companies, status } = useNotionData();
  const { search, vertical, stage, country, region, evAssetTag, openDrawer } = useFilterStore();
  const activeCount = [vertical, stage, country, region, evAssetTag].filter(Boolean).length;

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const filtered = companies.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (vertical && !(c.vertical || []).includes(vertical)) return false;
    if (stage && c.stage !== stage) return false;
    if (country && c.country?.id !== country) return false;
    if (region && c.country?.region !== region) return false;
    if (evAssetTag && !(c.eVAssetTags || []).includes(evAssetTag)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (a.rankingOrder ?? 999) - (b.rankingOrder ?? 999));

  return (
    <div className="stack" style={{ gap: 32 }}>
      <FilterDrawer />
      <div className="page-header row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Companies</h1>
          <p style={{ marginTop: 8 }}>
            {sorted.length} of {companies.length} e-mobility operators, OEMs, and tech companies tracked.
          </p>
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

      <div className="card stack" style={{ padding: 8, gap: 0 }}>
        {sorted.map((c) => (
          <Link key={c.id} to={`/company/${c.id}`} className="list-row">
            <RankBadge rank={c.rankingOrder} />
            <CompanyLogo name={c.name} website={c.website} size={28} />
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {(c.vertical || []).join(', ')}
            </span>
            {c.stage && <span className="chip chip-neutral">{displayStage(c.stage)}</span>}
            {c.country && (
              <span className="chip chip-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <CountryFlag name={c.country.name} size={12} />
                {c.country.name}
              </span>
            )}
          </Link>
        ))}
        {sorted.length === 0 && <p style={{ padding: 16 }}>No companies match these filters.</p>}
      </div>
    </div>
  );
}
