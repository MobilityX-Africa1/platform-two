import { useNotionData } from './useNotionData';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function countBy(allocators, getValues) {
  const counts = new Map();
  for (const a of allocators) {
    for (const v of getValues(a)) {
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  return counts;
}

// Builds the { groups, activeItems } shape FiltersMenu renders, keeping all
// allocator-specific field knowledge out of the generic popover component.
export function useAllocatorFilterGroups() {
  const { allocators, status } = useNotionData();
  const { investorType, geo, instrument, focusArea, aminOnly, idSet, toggleFilter, toggleAminOnly } =
    useAllocatorFilterStore();

  if (status !== 'ready') return { groups: [], activeItems: [] };

  const investorTypeCounts = countBy(allocators, (a) => [a.typeOfInvestor]);
  const geoCounts = countBy(allocators, (a) => a.geo || []);
  const instrumentCounts = countBy(allocators, (a) => a.investmentInstrument || []);
  const focusAreaCounts = countBy(allocators, (a) => a.focusAreas || []);

  const investorTypes = unique(allocators.map((a) => a.typeOfInvestor))
    .sort((a, b) => (investorTypeCounts.get(b) || 0) - (investorTypeCounts.get(a) || 0))
    .map((t) => ({ value: t, text: t, count: investorTypeCounts.get(t) }));

  const geos = unique(allocators.flatMap((a) => a.geo || []))
    .sort((a, b) => (geoCounts.get(b) || 0) - (geoCounts.get(a) || 0))
    .map((g) => ({ value: g, text: g, count: geoCounts.get(g) }));

  const instruments = unique(allocators.flatMap((a) => a.investmentInstrument || []))
    .sort((a, b) => (instrumentCounts.get(b) || 0) - (instrumentCounts.get(a) || 0))
    .map((i) => ({ value: i, text: i, count: instrumentCounts.get(i) }));

  const focusAreas = unique(allocators.flatMap((a) => a.focusAreas || []))
    .sort((a, b) => (focusAreaCounts.get(b) || 0) - (focusAreaCounts.get(a) || 0))
    .map((f) => ({ value: f, text: f, count: focusAreaCounts.get(f) }));

  const groups = [
    { key: 'investorType', label: 'Investor type', options: investorTypes, active: investorType, onToggle: (v) => toggleFilter('investorType', v) },
    { key: 'geo', label: 'Geographic focus', options: geos, active: geo, onToggle: (v) => toggleFilter('geo', v) },
    { key: 'instrument', label: 'Investment instrument', options: instruments, active: instrument, onToggle: (v) => toggleFilter('instrument', v) },
    { key: 'focusArea', label: 'Focus area', options: focusAreas, active: focusArea, onToggle: (v) => toggleFilter('focusArea', v) },
    {
      key: 'aminOnly',
      label: 'Membership',
      options: [{ value: true, text: 'AMIN members only' }],
      active: aminOnly ? true : null,
      onToggle: () => toggleAminOnly(),
    },
  ];

  const activeItems = [
    investorType && { key: 'investorType', text: investorType, onClear: () => toggleFilter('investorType', investorType) },
    geo && { key: 'geo', text: geo, onClear: () => toggleFilter('geo', geo) },
    instrument && { key: 'instrument', text: instrument, onClear: () => toggleFilter('instrument', instrument) },
    focusArea && { key: 'focusArea', text: focusArea, onClear: () => toggleFilter('focusArea', focusArea) },
    aminOnly && { key: 'aminOnly', text: 'AMIN members only', onClear: toggleAminOnly },
    idSet && { key: 'idSet', text: idSet.label, onClear: () => toggleFilter('idSet', idSet) },
  ].filter(Boolean);

  return { groups, activeItems };
}
