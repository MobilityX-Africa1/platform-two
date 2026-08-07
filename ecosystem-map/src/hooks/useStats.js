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

    const investmentByYear = Object.values(
      deals.reduce((acc, d) => {
        const year = d.date?.start ? new Date(d.date.start).getFullYear() : 'Unspecified';
        if (!acc[year]) acc[year] = { year, amount: 0 };
        acc[year].amount += d.amountM || 0;
        return acc;
      }, {}),
    ).sort((a, b) => (a.year === 'Unspecified' ? 1 : b.year === 'Unspecified' ? -1 : a.year - b.year));

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
    };
  }, [companies, countries, allocators, deals, status]);
}
