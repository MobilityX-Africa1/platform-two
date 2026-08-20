import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  search: '',
  vertical: null,
  stage: null,
  evAssetTag: null,
  country: null,
  region: null,

  setSearch: (search) => set({ search }),
  toggleFilter: (key, value) =>
    set((state) => ({ [key]: state[key] === value ? null : value })),
  clearFilters: () =>
    set({ search: '', vertical: null, stage: null, evAssetTag: null, country: null, region: null }),
}));
