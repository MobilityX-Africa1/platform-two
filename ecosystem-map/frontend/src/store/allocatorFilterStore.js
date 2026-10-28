import { create } from 'zustand';

const CLEARED = { search: '', investorType: null, geo: null, instrument: null, focusArea: null, aminOnly: false, idSet: null };

export const useAllocatorFilterStore = create((set) => ({
  ...CLEARED,
  // `idSet` narrows the list to a specific set of allocators another view
  // summarised (e.g. the investors behind the Deals page's current deals).

  setSearch: (search) => set({ search }),
  toggleFilter: (key, value) =>
    set((state) => ({ [key]: state[key] === value ? null : value })),
  toggleAminOnly: () => set((state) => ({ aminOnly: !state.aminOnly })),
  clearFilters: () => set(CLEARED),
  // Replaces every filter at once — for metric cards that open "exactly this view".
  showOnly: (filters = {}) => set({ ...CLEARED, ...filters }),
}));
