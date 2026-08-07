import { create } from 'zustand';
import { normalizeAll } from '../lib/normalize';

// Internal store keys stay short (companies/allocators/deals/countries) —
// only the wire-level entity name changed when Notion's databases were
// renamed to match Stuart's guidance doc. See CHANGES.md.
const ENTITIES = ['countries', 'companies', 'allocators', 'deals'];
const DS_ENTITY = {
  countries: 'countries',
  companies: 'companiesPipeline',
  allocators: 'capitalAllocators',
  deals: 'dealTracker',
};

// Publish gates Companies Pipeline and Capital Allocators — those records
// must never enter the app unless published. Countries is intentionally
// excluded: companies relate to Countries via `Headquarters Country`, and
// filtering unpublished countries out before relations are resolved would
// silently null out `company.country` for any company whose HQ country is
// still a stub (e.g. low-priority markets with minimal data). Pages that
// list countries as top-level entities (CountriesPage) filter by
// `country.publish` themselves instead.
const PUBLISH_GATED = new Set(['companies', 'allocators']);

async function fetchEntity(entity, { fresh = false } = {}) {
  const res = await fetch(`/api/notion?entity=${DS_ENTITY[entity]}${fresh ? '&fresh=1' : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}: ${res.status}`);
  return res.json(); // { cached, results }
}

/**
 * Relation properties are resolved by which database the target page
 * belongs to (not by guessing the Notion property label text), so this
 * works regardless of what the fields are actually named in Notion.
 */
function resolveRelations(recordsByType) {
  const index = new Map(); // id -> { type, record }
  for (const type of ENTITIES) {
    for (const record of recordsByType[type]) {
      index.set(record.id, { type, record });
    }
  }

  for (const type of ENTITIES) {
    for (const record of recordsByType[type]) {
      for (const key of record._relationKeys) {
        const resolved = record[key].map((id) => index.get(id)).filter(Boolean);
        record[key] = resolved.map((r) => r.record);

        for (const target of ENTITIES) {
          const matches = resolved.filter((r) => r.type === target).map((r) => r.record);
          if (matches.length) {
            record[`_related_${target}`] = [...(record[`_related_${target}`] || []), ...matches];
            // reverse link, since Notion doesn't always mirror the relation
            // property on the target database (e.g. Companies -> Country
            // has no matching relation property back on Countries)
            for (const match of matches) {
              match[`_related_${type}`] = [...(match[`_related_${type}`] || []), record];
            }
          }
        }
      }
    }
  }

  for (const company of recordsByType.companies) {
    company.country = company._related_countries?.[0] ?? null;
  }
  for (const deal of recordsByType.deals) {
    deal.company = deal._related_companies?.[0] ?? null;
    deal.allocators = deal._related_allocators ?? [];
  }
  for (const allocator of recordsByType.allocators) {
    allocator.markets = allocator._related_countries ?? [];
    allocator.deals = allocator._related_deals ?? [];
    allocator.portfolio = (allocator.deals || []).map((d) => d.company).filter(Boolean);
  }
  for (const country of recordsByType.countries) {
    country.companies = country._related_companies ?? [];
  }

  return recordsByType;
}

export const useDataStore = create((set, get) => ({
  status: 'idle', // idle | loading | ready | error
  refreshing: false, // background refetch — never gates the UI like `status` does
  error: null,
  cached: false,
  lastRefreshed: null,
  countries: [],
  companies: [],
  allocators: [],
  deals: [],

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
      const recordsByType = {};
      let anyCached = false;
      responses.forEach((res, i) => {
        const entity = ENTITIES[i];
        let records = normalizeAll(res.results);
        if (PUBLISH_GATED.has(entity)) records = records.filter((r) => r.publish === true);
        recordsByType[entity] = records;
        if (res.cached) anyCached = true;
      });
      resolveRelations(recordsByType);
      set({
        status: 'ready',
        refreshing: false,
        cached: anyCached,
        lastRefreshed: new Date(),
        ...recordsByType,
      });
    } catch (e) {
      set({ status: isBackgroundRefresh ? 'ready' : 'error', refreshing: false, error: e.message });
    }
  },

  refresh() {
    return get().fetchAll({ fresh: true });
  },
}));
