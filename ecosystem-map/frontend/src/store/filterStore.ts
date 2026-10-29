import { create } from 'zustand';

/** A specific set of records another view summarised, e.g. "In 30 tracked deals". */
export interface IdSet {
  ids: string[];
  label: string;
}

export type CompanySort = 'rank' | 'funding';

interface CompanyFilters {
  search: string;
  vertical: string | null;
  stage: string | null;
  evAssetTag: string | null;
  country: string | null;
  region: string | null;
  idSet: IdSet | null;
}

/** Filters that toggle: setting the active value again clears it. */
type ToggleKey = Exclude<keyof CompanyFilters, 'search'>;

interface CompanyFilterState extends CompanyFilters {
  sortBy: CompanySort;
  setSearch: (search: string) => void;
  toggleFilter: <K extends ToggleKey>(key: K, value: NonNullable<CompanyFilters[K]>) => void;
  clearFilters: () => void;
  showOnly: (filters?: Partial<CompanyFilters>, sortBy?: CompanySort) => void;
  setSortBy: (sortBy: CompanySort) => void;
}

const CLEARED: CompanyFilters = { search: '', vertical: null, stage: null, evAssetTag: null, country: null, region: null, idSet: null };

export const useFilterStore = create<CompanyFilterState>()((set) => ({
  ...CLEARED,
  // 'rank' (Top 50 ranking order — the list's default) | 'funding' (total
  // funding raised, descending). Independent of the filters above.
  sortBy: 'rank',
  // `idSet` narrows the list to a specific set of companies that another
  // view summarised — e.g. { ids: [...], label: 'In 30 tracked deals' } from
  // the Deals page's "Companies represented" card. Cleared like any filter.

  setSearch: (search) => set({ search }),
  toggleFilter: (key, value) =>
    set((state) => ({ [key]: state[key] === value ? null : value })),
  clearFilters: () => set(CLEARED),
  // Replaces every filter at once (unlike toggleFilter, never un-sets a value
  // that's already active) — for metric cards that open "exactly this view".
  showOnly: (filters = {}, sortBy = 'rank') => set({ ...CLEARED, ...filters, sortBy }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
