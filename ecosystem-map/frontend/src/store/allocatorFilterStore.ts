import { create } from 'zustand';
import type { IdSet } from './filterStore';

interface AllocatorFilters {
  search: string;
  investorType: string | null;
  geo: string | null;
  instrument: string | null;
  focusArea: string | null;
  aminOnly: boolean;
  idSet: IdSet | null;
}

/** Filters that toggle: setting the active value again clears it. */
type ToggleKey = Exclude<keyof AllocatorFilters, 'search' | 'aminOnly'>;

interface AllocatorFilterState extends AllocatorFilters {
  setSearch: (search: string) => void;
  toggleFilter: <K extends ToggleKey>(key: K, value: NonNullable<AllocatorFilters[K]>) => void;
  toggleAminOnly: () => void;
  clearFilters: () => void;
  showOnly: (filters?: Partial<AllocatorFilters>) => void;
}

const CLEARED: AllocatorFilters = { search: '', investorType: null, geo: null, instrument: null, focusArea: null, aminOnly: false, idSet: null };

export const useAllocatorFilterStore = create<AllocatorFilterState>()((set) => ({
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
