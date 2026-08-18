import { useMemo } from 'react';
import { useNotionData } from './useNotionData';
import { displayStage } from '../lib/format';

export function useStats() {
  const { companies, countries, allocators, deals, status } = useNotionData();

  return useMemo(() => {
    if (status !== 'ready') return null;

    const totalRaisedM = deals.reduce((sum, d) => sum + (d.amountM || 0), 0);

    const verticalBreakdown = Object.values(
      companies.reduce((acc, c) => {
        const tags = c.vertical?.length ? c.vertical : ['Unspecified'];
        for (const key of tags) {
          if (!acc[key]) acc[key] = { vertical: key, companies: 0 };
          acc[key].companies += 1;
        }
        return acc;
      }, {}),
    ).sort((a, b) => b.companies - a.companies);

    const stageBreakdown = Object.values(
      companies.reduce((acc, c) => {
        const key = displayStage(c.stage) || 'Unspecified';
        if (!acc[key]) acc[key] = { stage: key, companies: 0 };
        acc[key].companies += 1;
        return acc;
      }, {}),
    ).sort((a, b) => b.companies - a.companies);

    const dealSplit = Object.values(
      deals.reduce((acc, d) => {
        const key = d.dealType || 'Unspecified';
        if (!acc[key]) acc[key] = { dealType: key, amount: 0, count: 0 };
        acc[key].amount += d.amountM || 0;
        acc[key].count += 1;
        return acc;
      }, {}),
    );

    const leaderboard = [...companies]
      .filter((c) => c.rankingOrder != null)
      .sort((a, b) => a.rankingOrder - b.rankingOrder)
      .slice(0, 5);

    const countriesRepresented = new Set(
      companies.filter((c) => c.country).map((c) => c.country.id),
    );

    const datedDeals = deals.filter((d) => d.date?.start);
    const undatedInvestmentM = deals
      .filter((d) => !d.date?.start)
      .reduce((sum, d) => sum + (d.amountM || 0), 0);

    // Undated deals are excluded from the year series entirely (see
    // `undatedInvestmentM` above) rather than bucketed into a fake
    // 'Unspecified' year — a trend line can't plot a non-date.
    const investmentByYear = Object.values(
      datedDeals.reduce((acc, d) => {
        const year = new Date(d.date.start).getFullYear();
        if (!acc[year]) acc[year] = { year, amount: 0 };
        acc[year].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => a.year - b.year);

    // Trailing 8 quarters ending at the current (possibly partial) quarter,
    // zero-filled for any quarter with no dated deals — real history for the
    // "Total investment tracked" tile's sparkline + qtr-over-qtr delta, since
    // companies/countries/allocators have no equivalent timestamped history
    // (their Notion `created_time` is a one-off bulk-import date, not an
    // organic "added on" signal, so no sparkline/delta is computed for them).
    const now = new Date();
    const amountByQuarterKey = datedDeals.reduce((acc, d) => {
      const dt = new Date(d.date.start);
      const key = `${dt.getFullYear()}-Q${Math.floor(dt.getMonth() / 3) + 1}`;
      acc[key] = (acc[key] || 0) + (d.amountM || 0);
      return acc;
    }, {});
    let qy = now.getFullYear();
    let qq = Math.floor(now.getMonth() / 3) + 1;
    const quarterKeys = [];
    for (let i = 0; i < 8; i++) {
      quarterKeys.unshift(`${qy}-Q${qq}`);
      qq -= 1;
      if (qq === 0) { qq = 4; qy -= 1; }
    }
    const investmentByQuarter = quarterKeys.map((key) => amountByQuarterKey[key] || 0);
    const investmentThisQuarterM = amountByQuarterKey[quarterKeys[quarterKeys.length - 1]] || 0;

    // Share of the leading deal type (by amount), now vs. ~12 months ago,
    // both computed the same way (cumulative amount as of a date) so the
    // comparison is apples-to-apples. Null when there isn't enough dated
    // history on either side to compare, rather than a fabricated 0.
    const dealSplitByAmount = [...dealSplit].sort((a, b) => b.amount - a.amount);
    const leadingDealType = dealSplitByAmount[0]?.dealType ?? null;
    let leadingDealTypeShiftPts = null;
    if (leadingDealType) {
      const shareAsOf = (cutoff) => {
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
    const investmentByRegion = Object.values(
      deals.reduce((acc, d) => {
        const region = d.company?.country?.region || 'Unspecified';
        if (!acc[region]) acc[region] = { region, amount: 0 };
        acc[region].amount += d.amountM || 0;
        return acc;
      }, {}),
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
  }, [companies, countries, allocators, deals, status]);
}
