import { create } from 'zustand';

export const useAllocatorFilterStore = create((set) => ({
  search: '',
  investorType: null,
  geo: null,
  instrument: null,
  focusArea: null,
  aminOnly: false,

  setSearch: (search) => set({ search }),
  toggleFilter: (key, value) =>
    set((state) => ({ [key]: state[key] === value ? null : value })),
  toggleAminOnly: () => set((state) => ({ aminOnly: !state.aminOnly })),
  clearFilters: () =>
    set({ search: '', investorType: null, geo: null, instrument: null, focusArea: null, aminOnly: false }),
}));
