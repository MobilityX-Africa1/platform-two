import { useNotionData } from './useNotionData';
import { useFilterStore } from '../store/filterStore';
import { displayStage } from '../lib/format';
import { REGIONS } from '../lib/flags';

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// Counts each option against the full unfiltered company list, so a chip
// reads "how many companies this would match" rather than being a bare
// label — the number is what makes a long option list scannable.
function countBy(companies, getValues) {
  const counts = new Map();
  for (const c of companies) {
    for (const v of getValues(c)) {
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  return counts;
}

// Builds the { groups, activeItems } shape FiltersMenu renders, keeping all
// company-specific field knowledge (vertical/stage/EV asset/region/country)
// out of the generic popover component.
export function useCompanyFilterGroups() {
  const { companies, countries, status } = useNotionData();
  const { vertical, stage, evAssetTag, country, region, toggleFilter } = useFilterStore();

  if (status !== 'ready') return { groups: [], activeItems: [] };

  const verticalCounts = countBy(companies, (c) => c.vertical || []);
  const stageCounts = countBy(companies, (c) => [c.stage]);
  const evAssetCounts = countBy(companies, (c) => c.eVAssetTags || []);
  const regionCounts = countBy(companies, (c) => [c.country?.region]);
  const countryCounts = countBy(companies, (c) => [c.country?.id]);

  const verticals = unique(companies.flatMap((c) => c.vertical || []))
    .sort((a, b) => (verticalCounts.get(b) || 0) - (verticalCounts.get(a) || 0))
    .map((v) => ({ value: v, text: v, count: verticalCounts.get(v) }));

  const stages = unique(companies.map((c) => c.stage))
    .sort((a, b) => (stageCounts.get(b) || 0) - (stageCounts.get(a) || 0))
    .map((s) => ({ value: s, text: displayStage(s), count: stageCounts.get(s) }));

  const evAssetTags = unique(companies.flatMap((c) => c.eVAssetTags || []))
    .sort((a, b) => (evAssetCounts.get(b) || 0) - (evAssetCounts.get(a) || 0))
    .map((t) => ({ value: t, text: t, count: evAssetCounts.get(t) }));

  const regions = REGIONS
    .map((r) => ({ value: r, text: r, count: regionCounts.get(r) || 0 }))
    .sort((a, b) => b.count - a.count);

  // Countries isn't publish-gated at the store level (see dataStore.js), so
  // filter here to keep unpublished stub markets out of the filter options.
  const publishedCountries = countries
    .filter((c) => c.publish === true)
    .sort((a, b) => (countryCounts.get(b.id) || 0) - (countryCounts.get(a.id) || 0))
    .map((c) => ({ value: c.id, text: c.name, count: countryCounts.get(c.id) || 0 }));

  const groups = [
    { key: 'vertical', label: 'Vertical', options: verticals, active: vertical, onToggle: (v) => toggleFilter('vertical', v) },
    { key: 'stage', label: 'Stage', options: stages, active: stage, onToggle: (v) => toggleFilter('stage', v) },
    { key: 'evAssetTag', label: 'EV asset type', options: evAssetTags, active: evAssetTag, onToggle: (v) => toggleFilter('evAssetTag', v) },
    { key: 'region', label: 'Region', options: regions, active: region, onToggle: (v) => toggleFilter('region', v) },
    { key: 'country', label: 'Country', options: publishedCountries, active: country, onToggle: (v) => toggleFilter('country', v) },
  ];

  const activeItems = [
    vertical && { key: 'vertical', text: vertical, onClear: () => toggleFilter('vertical', vertical) },
    stage && { key: 'stage', text: displayStage(stage), onClear: () => toggleFilter('stage', stage) },
    evAssetTag && { key: 'evAssetTag', text: evAssetTag, onClear: () => toggleFilter('evAssetTag', evAssetTag) },
    region && { key: 'region', text: region, onClear: () => toggleFilter('region', region) },
    country && {
      key: 'country',
      text: publishedCountries.find((c) => c.value === country)?.text ?? country,
      onClear: () => toggleFilter('country', country),
    },
  ].filter(Boolean);

  return { groups, activeItems };
}
