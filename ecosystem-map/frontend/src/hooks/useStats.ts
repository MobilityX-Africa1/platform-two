import { useMemo } from 'react';
import { useNotionData } from './useNotionData';
import { displayStage } from '../lib/format';
import type { Company, DateValue } from '../types/records';

export interface Stats {
  companiesTracked: number;
  /** In millions — format with formatUSDM. */
  totalRaisedM: number;
  countriesTracked: number;
  activeAllocators: number;
  verticalBreakdown: { vertical: string; companies: number }[];
  stageBreakdown: { stage: string; companies: number }[];
  dealSplit: { dealType: string; amount: number; count: number }[];
  /** Top 5 by Ranking order. */
  leaderboard: Company[];
  /** Dated deals only; see undatedInvestmentM. */
  investmentByYear: { year: number; amount: number }[];
  investmentByRegion: { region: string; amount: number }[];
  undatedInvestmentM: number;
  /** Trailing 8 quarters, oldest first, ending with the current quarter. */
  investmentByQuarter: number[];
  investmentThisQuarterM: number;
  leadingDealType: string | null;
  /** Leading deal type's share now vs. a year ago, in percentage points. */
  leadingDealTypeShiftPts: number | null;
}

/** Group `items` by `keyOf`, folding each into its group's accumulator. */
function groupBy<T, G>(items: T[], keyOf: (item: T) => string | number, init: (key: string) => G, add: (group: G, item: T) => void): G[] {
  const groups = new Map<string, G>();
  for (const item of items) {
    const key = String(keyOf(item));
    let group = groups.get(key);
    if (!group) groups.set(key, (group = init(key)));
    add(group, item);
  }
  return [...groups.values()];
}

export function useStats(): Stats | null {
  const { companies, allocators, deals, status } = useNotionData();

  return useMemo(() => {
    if (status !== 'ready') return null;

    const totalRaisedM = deals.reduce((sum, d) => sum + (d.amountM || 0), 0);

    // A company with several vertical tags counts once under each.
    const verticalTags = companies.flatMap((c) => (c.vertical.length ? c.vertical : ['Unspecified']));
    const verticalBreakdown = groupBy(
      verticalTags,
      (tag) => tag,
      (vertical) => ({ vertical, companies: 0 }),
      (g) => { g.companies += 1; },
    ).sort((a, b) => b.companies - a.companies);

    const stageBreakdown = groupBy(
      companies,
      (c) => displayStage(c.stage) || 'Unspecified',
      (stage) => ({ stage, companies: 0 }),
      (g) => { g.companies += 1; },
    ).sort((a, b) => b.companies - a.companies);

    const dealSplit = groupBy(
      deals,
      (d) => d.dealType || 'Unspecified',
      (dealType) => ({ dealType, amount: 0, count: 0 }),
      (g, d) => { g.amount += d.amountM || 0; g.count += 1; },
    );

    const leaderboard = companies
      .filter((c) => c.rankingOrder != null)
      .sort((a, b) => a.rankingOrder! - b.rankingOrder!)
      .slice(0, 5);

    const countriesRepresented = new Set(
      companies.flatMap((c) => (c.country ? [c.country.id] : [])),
    );

    const datedDeals = deals.filter((d): d is typeof d & { date: DateValue } => !!d.date?.start);
    const undatedInvestmentM = deals
      .filter((d) => !d.date?.start)
      .reduce((sum, d) => sum + (d.amountM || 0), 0);

    // Undated deals are excluded from the year series entirely (see
    // `undatedInvestmentM` above) rather than bucketed into a fake
    // 'Unspecified' year — a trend line can't plot a non-date.
    const investmentByYear = groupBy(
      datedDeals,
      (d) => new Date(d.date.start).getFullYear(),
      (year) => ({ year: Number(year), amount: 0 }),
      (g, d) => { g.amount += d.amountM || 0; },
    ).sort((a, b) => a.year - b.year);

    // Trailing 8 quarters ending at the current (possibly partial) quarter,
    // zero-filled for any quarter with no dated deals — real history for the
    // "Total investment tracked" tile's sparkline + qtr-over-qtr delta, since
    // companies/countries/allocators have no equivalent timestamped history
    // (their Notion `created_time` is a one-off bulk-import date, not an
    // organic "added on" signal, so no sparkline/delta is computed for them).
    const now = new Date();
    const amountByQuarterKey = datedDeals.reduce<Record<string, number>>((acc, d) => {
      const dt = new Date(d.date.start);
      const key = `${dt.getFullYear()}-Q${Math.floor(dt.getMonth() / 3) + 1}`;
      acc[key] = (acc[key] || 0) + (d.amountM || 0);
      return acc;
    }, {});
    let qy = now.getFullYear();
    let qq = Math.floor(now.getMonth() / 3) + 1;
    const quarterKeys: string[] = [];
    for (let i = 0; i < 8; i++) {
      quarterKeys.unshift(`${qy}-Q${qq}`);
      qq -= 1;
      if (qq === 0) { qq = 4; qy -= 1; }
    }
    const investmentByQuarter = quarterKeys.map((key) => amountByQuarterKey[key] || 0);
    const investmentThisQuarterM = amountByQuarterKey[quarterKeys.at(-1)!] || 0;

    // Share of the leading deal type (by amount), now vs. ~12 months ago,
    // both computed the same way (cumulative amount as of a date) so the
    // comparison is apples-to-apples. Null when there isn't enough dated
    // history on either side to compare, rather than a fabricated 0.
    const dealSplitByAmount = [...dealSplit].sort((a, b) => b.amount - a.amount);
    const leadingDealType = dealSplitByAmount[0]?.dealType ?? null;
    let leadingDealTypeShiftPts = null;
    if (leadingDealType) {
      const shareAsOf = (cutoff: Date) => {
        const subset = datedDeals.filter((d) => new Date(d.date.start) <= cutoff);
        const total = subset.reduce((s, d) => s + (d.amountM || 0), 0);
        if (!total) return null;
        const lead = subset
          .filter((d) => (d.dealType || 'Unspecified') === leadingDealType)
          .reduce((s, d) => s + (d.amountM || 0), 0);
        return (lead / total) * 100;
      };
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const nowShare = shareAsOf(now);
      const pastShare = shareAsOf(yearAgo);
      if (nowShare != null && pastShare != null) {
        leadingDealTypeShiftPts = Math.round(nowShare - pastShare);
      }
    }

    // Amount flows through the deal's company -> Headquarters Country -> Region.
    // Deals whose company has no linked country bucket into 'Unspecified'
    // rather than being silently dropped from the total.
    const investmentByRegion = groupBy(
      deals,
      (d) => d.company?.country?.region || 'Unspecified',
      (region) => ({ region, amount: 0 }),
      (g, d) => { g.amount += d.amountM || 0; },
    ).sort((a, b) => b.amount - a.amount);

    return {
      companiesTracked: companies.length,
      totalRaisedM,
      countriesTracked: countriesRepresented.size,
      activeAllocators: allocators.length,
      verticalBreakdown,
      stageBreakdown,
      dealSplit,
      leaderboard,
      investmentByYear,
      investmentByRegion,
      undatedInvestmentM,
      investmentByQuarter,
      investmentThisQuarterM,
      leadingDealType,
      leadingDealTypeShiftPts,
    };
  }, [companies, allocators, deals, status]);
}
