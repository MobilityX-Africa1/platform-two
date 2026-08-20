import { create } from 'zustand';
import { normalizeAll } from '../lib/normalize';

// Internal store keys stay short (companies/allocators/deals/countries) —
// only the wire-level entity name changed when Notion's databases were
// renamed to match Stuart's guidance doc. See CHANGES.md.
const ENTITIES = ['countries', 'companies', 'allocators', 'deals', 'economics'];
const DS_ENTITY = {
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

  function activeCountryIds(allocator) {
    const ids = new Set((allocator.markets || []).map((c) => c.id));
    for (const tag of allocator.geo || []) {
      if (UNIVERSAL_GEO_TAGS.has(tag)) {
        recordsByType.countries.forEach((c) => ids.add(c.id));
      } else if (REGION_GEO_TAGS.has(tag)) {
        recordsByType.countries.filter((c) => c.region === tag).forEach((c) => ids.add(c.id));
      } else {
        recordsByType.countries.filter((c) => c.name === tag).forEach((c) => ids.add(c.id));
      }
    }
    return ids;
  }

  for (const allocator of recordsByType.allocators) {
    const marketIds = activeCountryIds(allocator);
    allocator.marketCompanies = recordsByType.companies.filter(
      (c) => c.country && marketIds.has(c.country.id),
    );
    allocator.connectedCompanies = [
      ...new Map(
        [...allocator.portfolio, ...allocator.marketCompanies].map((c) => [c.id, c]),
      ).values(),
    ];
  }
  for (const company of recordsByType.companies) {
    company.marketAllocators = recordsByType.allocators.filter((a) =>
      (a.marketCompanies || []).some((c) => c.id === company.id),
    );
  }
  // "Country (Link)" is the only relation on Asset Economics, and each row
  // covers a single market, so the first match is the whole relationship.
  for (const econ of recordsByType.economics) {
    econ.country = econ._related_countries?.[0] ?? null;
  }
  for (const country of recordsByType.countries) {
    country.economics = country._related_economics?.[0] ?? null;
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
