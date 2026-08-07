import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  search: '',
  vertical: null,
  stage: null,
  evAssetTag: null,
  country: null,
  region: null,
  drawerOpen: false,

  setSearch: (search) => set({ search }),
  toggleFilter: (key, value) =>
    set((state) => ({ [key]: state[key] === value ? null : value })),
  clearFilters: () =>
    set({ search: '', vertical: null, stage: null, evAssetTag: null, country: null, region: null }),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
