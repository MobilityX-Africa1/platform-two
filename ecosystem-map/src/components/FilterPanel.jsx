import { useNotionData } from '../hooks/useNotionData';
import { useFilterStore } from '../store/filterStore';
import { displayStage } from '../lib/format';
import { REGIONS } from '../lib/flags';

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function ChipRow({ label, options, valueKey, getLabel, getText }) {
  const active = useFilterStore((s) => s[valueKey]);
  const toggleFilter = useFilterStore((s) => s.toggleFilter);

  return (
    <div className="filter-group">
      <div className="filter-group-label">{label}</div>
      <div className="filter-chip-row">
        {options.map((opt) => {
          const value = getLabel ? getLabel(opt) : opt;
          const text = getText ? getText(opt) : opt;
          return (
            <button
              key={value}
              type="button"
              className={`filter-chip${active === value ? ' selected' : ''}`}
              onClick={() => toggleFilter(valueKey, value)}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanel() {
  const { companies, countries, status } = useNotionData();

  if (status !== 'ready') return null;

  const verticals = unique(companies.flatMap((c) => c.vertical || []));
  const stages = unique(companies.map((c) => c.stage));
  const evAssetTags = unique(companies.flatMap((c) => c.eVAssetTags || []));
  // Countries isn't publish-gated at the store level (see dataStore.js), so
  // filter here to keep unpublished stub markets out of the filter chips.
  const publishedCountries = countries.filter((c) => c.publish === true);

  return (
    <div>
      <ChipRow label="Vertical" options={verticals} valueKey="vertical" />
      <ChipRow label="Stage" options={stages} valueKey="stage" getText={displayStage} />
      <ChipRow label="EV asset type" options={evAssetTags} valueKey="evAssetTag" />
      <ChipRow label="Region" options={REGIONS} valueKey="region" />
      <ChipRow
        label="Country"
        options={publishedCountries}
        valueKey="country"
        getLabel={(c) => c.id}
        getText={(c) => c.name}
      />
    </div>
  );
}
