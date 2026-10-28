import { Building2, Globe2, Landmark, TrendingUp } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { useStats } from '../hooks/useStats';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { DonutChart } from '../components/DonutChart';
import { RankedList } from '../components/RankedList';
import { InvestmentTimeline } from '../components/InvestmentTimeline';
import { BarChart } from '../components/BarChart';
import { CompanyLogo } from '../components/CompanyLogo';
import { CardSkeletonGrid, ListSkeleton } from '../components/Skeletons';
import { RankBadge } from '../components/RankBadge';
import { Row } from '../components/DataTableRow';
import { formatUSDM, formatNumber, displayStage } from '../lib/format';
import { useFilterStore } from '../store/filterStore';
import { useAllocatorFilterStore } from '../store/allocatorFilterStore';

// Funding-round progression, left to right — everything else (Bootstrapped,
// plus any data-quality bucket like "Unspecified"/"Placeholder") is grouped
// separately below, not interleaved into the raise progression.
const STAGE_PROGRESSION = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth Stage', 'Series C+'];

// Short axis labels for the stage bar chart — the full stage names don't
// fit under narrow bars in the hero row's side column.
const STAGE_ABBR = {
  'Pre-seed': 'Pre',
  Seed: 'Seed',
  'Series A': 'A',
  'Series B': 'B',
  'Growth Stage': 'Growth',
  'Series C+': 'C+',
  Bootstrapped: 'Boot.',
};

function formatDelta(amountM) {
  if (!amountM) return '$0 this qtr';
  const sign = amountM > 0 ? '+' : '';
  return `${sign}${formatUSDM(amountM)} this qtr`;
}

function deltaTrendOf(amountM) {
  if (!amountM) return 'flat';
  return amountM > 0 ? 'up' : 'down';
}

export function DashboardPage() {
  const { status } = useNotionData();
  const stats = useStats();

  if (status !== 'ready' || !stats) {
    return (
      <div className="stack">
        <span className="eyebrow page-eyebrow" data-pillar="overview">Ecosystem overview</span>
        <h1>Dashboard</h1>
        <CardSkeletonGrid count={4} />
        <ListSkeleton count={6} />
      </div>
    );
  }

  const dealSplitSorted = [...stats.dealSplit].sort((a, b) => b.amount - a.amount);

  const regionsRanked = stats.investmentByRegion.filter((r) => r.region !== 'Unspecified');
  const regionUnspecified = stats.investmentByRegion.find((r) => r.region === 'Unspecified');

  const stageByKey = Object.fromEntries(stats.stageBreakdown.map((g) => [g.stage, g]));
  const stageReal = [
    ...STAGE_PROGRESSION.filter((s) => stageByKey[s]).map((s) => stageByKey[s]),
    ...(stageByKey['Bootstrapped'] ? [stageByKey['Bootstrapped']] : []),
  ];

  // Year-over-year change on the hero chart's headline figure — same
  // "now vs. a comparable prior period" pattern as the KPI tile's
  // qtr-over-qtr delta, just at annual grain to match the chart below it.
  // The running year is excluded from the comparison itself (though it still
  // plots on the line) — it's only partially through, so stacking it against
  // a complete prior year would read as a misleading crash every January.
  const currentYear = new Date().getFullYear();
  const completedYears = stats.investmentByYear.filter((y) => y.year < currentYear);
  const lastYear = completedYears[completedYears.length - 1];
  const prevYear = completedYears[completedYears.length - 2];
  const heroDeltaPct =
    lastYear && prevYear && prevYear.amount > 0
      ? Math.round(((lastYear.amount - prevYear.amount) / prevYear.amount) * 100)
      : null;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-header">
        <span className="eyebrow page-eyebrow" data-pillar="overview">Ecosystem overview</span>
        <h1>Dashboard</h1>
        <p style={{ marginTop: 8 }}>
          Live snapshot of the African e-mobility ecosystem — Countries, Companies, and Capital.
        </p>
      </div>

      <MetricGrid className="metric-grid-compact">
        <MetricCard
          label="Companies tracked"
          value={formatNumber(stats.companiesTracked)}
          to="/companies"
          // Filters persist in a global store — clear any left over from an
          // earlier visit so the list matches this card's unfiltered total.
          onClick={() => useFilterStore.getState().showOnly({})}
          actionHint="show all companies"
          icon={Building2}
          accent="plum"
        />
        <MetricCard
          label="Total investment tracked"
          value={formatUSDM(stats.totalRaisedM)}
          delta={formatDelta(stats.investmentThisQuarterM)}
          deltaTrend={deltaTrendOf(stats.investmentThisQuarterM)}
          to="/deals"
          actionHint="open deal aggregates"
          icon={TrendingUp}
          accent="leaf"
        />
        <MetricCard
          label="Countries represented"
          value={formatNumber(stats.countriesTracked)}
          to="/countries"
          actionHint="open the countries breakdown"
          icon={Globe2}
          accent="sky"
        />
        <MetricCard
          label="Capital allocators"
          value={formatNumber(stats.activeAllocators)}
          to="/allocators"
          onClick={() => useAllocatorFilterStore.getState().showOnly({})}
          actionHint="show all capital allocators"
          icon={Landmark}
          accent="coral"
        />
      </MetricGrid>

      <div className="dashboard-hero-grid">
        <div className="card hero-card">
          <div className="hero-card-head">
            <div>
              <span className="metric-label">Investment over time</span>
              <div className="hero-card-value num">{formatUSDM(stats.totalRaisedM)}</div>
              {heroDeltaPct != null && (
                <span
                  className={`metric-delta-pill metric-delta-pill--${heroDeltaPct >= 0 ? 'up' : 'down'}`}
                  style={{ marginTop: 6 }}
                >
                  {heroDeltaPct >= 0 ? '+' : ''}
                  {heroDeltaPct}% vs {prevYear.year}
                </span>
              )}
            </div>
            {stats.undatedInvestmentM > 0 && (
              <span className="muted" style={{ fontSize: 'var(--text-xs)', textAlign: 'right' }}>
                + {formatUSDM(stats.undatedInvestmentM)} with no date on record
              </span>
            )}
          </div>
          <InvestmentTimeline data={stats.investmentByYear} formatValue={formatUSDM} height={230} />
        </div>

        <div className="dashboard-hero-side">
          <div className="card compact-card">
            <h3 className="compact-card-title">Companies by stage</h3>
            <BarChart
              data={stageReal}
              valueKey="companies"
              labelKey="stage"
              formatLabel={(s) => STAGE_ABBR[s] || s}
            />
          </div>

          <div className="card compact-card">
            <h3 className="compact-card-title">Deal split by type</h3>
            {dealSplitSorted.length <= 3 ? (
              <DonutChart
                segments={dealSplitSorted.map((d) => ({ label: d.dealType, value: d.amount }))}
                centerValue={formatUSDM(stats.totalRaisedM)}
                centerLabel="tracked"
                legendSuffix={(v) => formatUSDM(v)}
              />
            ) : (
              <RankedList
                items={dealSplitSorted.map((d) => ({ label: d.dealType, value: d.amount }))}
                formatValue={formatUSDM}
              />
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-top-grid">
        <div className="dashboard-top-grid-cell">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">Top 5 leaderboard</h2>
            {/* Ordered by Notion's "Ranking order" (the Top 50 rank) in useStats — not by amount raised. */}
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>by Top 50 rank</span>
          </div>
          {stats.leaderboard.length === 0 ? (
            <div className="card" style={{ padding: 8 }}>
              <p className="muted" style={{ padding: 8 }}>No Top 50 rankings recorded yet.</p>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <tbody>
                  {stats.leaderboard.map((c) => (
                    <Row key={c.id} to={`/company/${c.id}`}>
                      <td><div className="data-table-name">
                        <RankBadge rank={c.rankingOrder} />
                        <CompanyLogo name={c.name} website={c.website} size={26} />
                        <span>{c.name}</span>
                      </div></td>
                      <td className="data-table-num-cell">{formatUSDM(c.totalFundingRaisedM)}</td>
                      <td className="data-table-chip-cell">
                        {c.stage && <span className="chip chip-neutral">{displayStage(c.stage)}</span>}
                      </td>
                    </Row>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dashboard-top-grid-cell">
          <h2 className="section-title">Companies by vertical</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            <RankedList
              items={stats.verticalBreakdown.map((v) => ({ label: v.vertical, value: v.companies }))}
              formatValue={formatNumber}
              linkTo={(item) => `/vertical/${encodeURIComponent(item.label)}`}
            />
          </div>
        </div>

        <div className="dashboard-top-grid-cell">
          <h2 className="section-title">Investment by region</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            <RankedList
              items={regionsRanked.map((r) => ({ label: r.region, value: r.amount }))}
              formatValue={formatUSDM}
              footnote={regionUnspecified ? { label: 'Unspecified (unmapped)', value: regionUnspecified.amount } : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
