import { create } from 'zustand';
import { normalizeAll } from '../lib/normalize';
import type { NormalizedRecord, NotionPage } from '../lib/normalize';
import type {
  Allocator, Company, Country, DataStatus, Deal, Economics, EntityType, Records,
} from '../types/records';

// Internal store keys stay short (companies/allocators/deals/countries) —
// only the wire-level entity name changed when Notion's databases were
// renamed to match Stuart's guidance doc. See CHANGES.md.
const ENTITIES: EntityType[] = ['countries', 'companies', 'allocators', 'deals', 'economics'];
const DS_ENTITY: Record<EntityType, string> = {
  countries: 'countries',
  companies: 'companiesPipeline',
  allocators: 'capitalAllocators',
  deals: 'dealTracker',
  economics: 'assetEconomics',
};

// Publish gates Companies Pipeline and Capital Allocators — those records
// must never enter the app unless published. Countries is intentionally
// excluded: companies relate to Countries via `Headquarters Country`, and
// filtering unpublished countries out before relations are resolved would
// silently null out `company.country` for any company whose HQ country is
// still a stub (e.g. low-priority markets with minimal data). Pages that
// list countries as top-level entities (CountriesPage) filter by
// `country.publish` themselves instead.
const PUBLISH_GATED = new Set<EntityType>(['companies', 'allocators']);

interface EntityResponse {
  cached: boolean;
  results: NotionPage[];
}

async function fetchEntity(entity: EntityType, { fresh = false } = {}): Promise<EntityResponse> {
  const res = await fetch(`/api/notion?entity=${DS_ENTITY[entity]}${fresh ? '&fresh=1' : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}: ${res.status}`);
  return res.json();
}

// resolveRelations() works on untyped rows: relation keys come from Notion
// at runtime, and it rewrites them in place (id arrays become record
// arrays) and bolts on new keys. These helpers keep that dynamic access in
// one place; the function's return is where rows become typed records.
type Row = NormalizedRecord;
type RowsByType = Record<EntityType, Row[]>;

function related(row: Row, type: EntityType): Row[] {
  return (row[`_related_${type}`] as Row[] | undefined) ?? [];
}

function addRelated(row: Row, type: EntityType, rows: Row[]): void {
  row[`_related_${type}`] = [...related(row, type), ...rows];
}

/**
 * Relation properties are resolved by which database the target page
 * belongs to (not by guessing the Notion property label text), so this
 * works regardless of what the fields are actually named in Notion.
 */
function resolveRelations(rowsByType: RowsByType): Records {
  const index = new Map<string, { type: EntityType; row: Row }>();
  for (const type of ENTITIES) {
    for (const row of rowsByType[type]) {
      index.set(row.id, { type, row });
    }
  }

  for (const type of ENTITIES) {
    for (const row of rowsByType[type]) {
      for (const key of row._relationKeys) {
        const resolved = (row[key] as string[])
          .map((id) => index.get(id))
          .filter((r) => r !== undefined);
        row[key] = resolved.map((r) => r.row);

        for (const target of ENTITIES) {
          const matches = resolved.filter((r) => r.type === target).map((r) => r.row);
          if (matches.length) {
            addRelated(row, target, matches);
            // reverse link, since Notion doesn't always mirror the relation
            // property on the target database (e.g. Companies -> Country
            // has no matching relation property back on Countries)
            for (const match of matches) {
              addRelated(match, type, [row]);
            }
          }
        }
      }
    }
  }

  // The rows now carry every relation, forward and reverse; the friendly
  // fields below are assigned through the typed view of the same objects.
  const records = rowsByType as unknown as Records;
  const rowOf = (record: { id: string }) => record as unknown as Row;

  for (const company of records.companies) {
    company.country = (related(rowOf(company), 'countries')[0] ?? null) as Country | null;
  }
  for (const deal of records.deals) {
    deal.company = (related(rowOf(deal), 'companies')[0] ?? null) as Company | null;
    deal.allocators = related(rowOf(deal), 'allocators') as unknown as Allocator[];
  }
  for (const allocator of records.allocators) {
    allocator.markets = related(rowOf(allocator), 'countries') as unknown as Country[];
    allocator.deals = related(rowOf(allocator), 'deals') as unknown as Deal[];
    allocator.portfolio = allocator.deals.map((d) => d.company).filter((c) => c !== null);
  }
  for (const country of records.countries) {
    country.companies = related(rowOf(country), 'companies') as unknown as Company[];
  }

  // Company <-> Capital Allocator, via shared operating country.
  //
  // There is no direct Company<->Allocator relation in Notion. The only
  // structured link (Deal Tracker's "Investor" field) is populated on very
  // few deals whose investor also happens to be a *published* allocator —
  // most published allocators (see CHANGES.md's Publish gate) end up with
  // zero deal-linked companies as a result, even though the underlying data
  // is richer than that. Notion's own "Capital Allocators (via Country)"
  // rollup on Companies Pipeline surfaces the same broader signal: which
  // allocators are active in a company's market. Both halves of that path —
  // company.country (via Location) and allocator.markets (via "African
  // markets active") — are already resolved above, so it's rebuilt here
  // client-side instead of requiring a new Notion field fetch. The
  // free-text `Geo` tags (region names like "East Africa" and catch-alls
  // like "Pan-African"/"Global") are folded in too since every published
  // allocator has Geo set but only about a third has the structured
  // "African markets active" relation populated.
  const REGION_GEO_TAGS = new Set([
    'East Africa', 'West Africa', 'North Africa', 'Southern Africa', 'Central Africa',
  ]);
  const UNIVERSAL_GEO_TAGS = new Set(['Pan-African', 'Global']);

  function activeCountryIds(allocator: Allocator): Set<string> {
    const ids = new Set(allocator.markets.map((c) => c.id));
    for (const tag of allocator.geo || []) {
      if (UNIVERSAL_GEO_TAGS.has(tag)) {
        records.countries.forEach((c) => ids.add(c.id));
      } else if (REGION_GEO_TAGS.has(tag)) {
        records.countries.filter((c) => c.region === tag).forEach((c) => ids.add(c.id));
      } else {
        records.countries.filter((c) => c.name === tag).forEach((c) => ids.add(c.id));
      }
    }
    return ids;
  }

  for (const allocator of records.allocators) {
    const marketIds = activeCountryIds(allocator);
    allocator.marketCompanies = records.companies.filter(
      (c) => c.country && marketIds.has(c.country.id),
    );
    allocator.connectedCompanies = [
      ...new Map(
        [...allocator.portfolio, ...allocator.marketCompanies].map((c) => [c.id, c]),
      ).values(),
    ];
  }
  for (const company of records.companies) {
    company.marketAllocators = records.allocators.filter((a) =>
      a.marketCompanies.some((c) => c.id === company.id),
    );
  }
  // "Country (Link)" is the only relation on Asset Economics, and each row
  // covers a single market, so the first match is the whole relationship.
  for (const econ of records.economics) {
    econ.country = (related(rowOf(econ), 'countries')[0] ?? null) as Country | null;
  }
  for (const country of records.countries) {
    country.economics = (related(rowOf(country), 'economics')[0] ?? null) as Economics | null;
  }

  return records;
}

interface DataState extends Records {
  status: DataStatus;
  /** Background refetch — never gates the UI like `status` does. */
  refreshing: boolean;
  error: string | null;
  cached: boolean;
  lastRefreshed: Date | null;
  fetchAll: (options?: { fresh?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDataStore = create<DataState>()((set, get) => ({
  status: 'idle',
  refreshing: false,
  error: null,
  cached: false,
  lastRefreshed: null,
  countries: [],
  companies: [],
  allocators: [],
  deals: [],
  economics: [],

  async fetchAll({ fresh = false } = {}) {
    // A refresh of already-loaded data must not flip `status` away from
    // 'ready' — pages gate their layout on `status`, so doing so would blow
    // away the current view in favor of a loading skeleton. Track it via
    // `refreshing` instead, which nothing renders a skeleton off of.
    const isBackgroundRefresh = fresh && get().status === 'ready';
    if (isBackgroundRefresh) {
      set({ refreshing: true, error: null });
    } else {
      set({ status: 'loading', error: null });
    }
    try {
      const responses = await Promise.all(ENTITIES.map((e) => fetchEntity(e, { fresh })));
      const rowsByType = {} as RowsByType;
      let anyCached = false;
      responses.forEach((res, i) => {
        const entity = ENTITIES[i]!;
        let rows = normalizeAll(res.results);
        if (PUBLISH_GATED.has(entity)) rows = rows.filter((r) => r.publish === true);
        rowsByType[entity] = rows;
        if (res.cached) anyCached = true;
      });
      const records = resolveRelations(rowsByType);
      set({
        status: 'ready',
        refreshing: false,
        cached: anyCached,
        lastRefreshed: new Date(),
        ...records,
      });
    } catch (e) {
      set({
        status: isBackgroundRefresh ? 'ready' : 'error',
        refreshing: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  refresh() {
    return get().fetchAll({ fresh: true });
  },
}));
