import { Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { useStats } from '../hooks/useStats';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { DonutChart } from '../components/DonutChart';
import { RankedList } from '../components/RankedList';
import { InvestmentTimeline } from '../components/InvestmentTimeline';
import { CardSkeletonGrid, ListSkeleton } from '../components/Skeletons';
import { RankBadge } from '../components/RankBadge';
import { formatUSDM, formatNumber, displayStage } from '../lib/format';

// Funding-round progression, left to right — everything else (Bootstrapped,
// plus any data-quality bucket like "Unspecified"/"Placeholder") is grouped
// separately below, not interleaved into the raise progression.
const STAGE_PROGRESSION = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth Stage', 'Series C+'];

function formatDelta(amountM) {
  const sign = amountM > 0 ? '+' : '';
  return `${sign}${formatUSDM(amountM)} this qtr`;
}

export function DashboardPage() {
  const { status } = useNotionData();
  const stats = useStats();

  if (status !== 'ready' || !stats) {
    return (
      <div className="stack">
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

  return (
    <div className="stack" style={{ gap: 40 }}>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p style={{ marginTop: 8 }}>
          Live snapshot of the African e-mobility ecosystem — Countries, Companies, and Capital.
        </p>
      </div>

      <MetricGrid className="metric-grid-compact">
        <MetricCard label="Companies tracked" value={formatNumber(stats.companiesTracked)} to="/companies" />
        <MetricCard
          label="Total investment tracked"
          value={formatUSDM(stats.totalRaisedM)}
          delta={formatDelta(stats.investmentThisQuarterM)}
          sparkline={stats.investmentByQuarter}
          to="/deals"
        />
        <MetricCard label="Countries represented" value={formatNumber(stats.countriesTracked)} to="/countries" />
        <MetricCard label="Capital allocators" value={formatNumber(stats.activeAllocators)} to="/allocators" />
      </MetricGrid>

      <div className="dashboard-top-grid">
        <div className="dashboard-top-grid-cell">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">Top 5 leaderboard</h2>
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>by capital raised</span>
          </div>
          <div className="card ranked-list" style={{ padding: '4px 12px' }}>
            {stats.leaderboard.map((c) => (
              <Link
                key={c.id}
                to={`/company/${c.id}`}
                className="ranked-list-row leaderboard-row"
              >
                <RankBadge rank={c.rankingOrder} />
                <span className="leaderboard-name">{c.name}</span>
                <span className="ranked-list-value num">{formatUSDM(c.totalFundingRaisedM)}</span>
                {c.stage && <span className="chip chip-neutral leaderboard-stage">{displayStage(c.stage)}</span>}
              </Link>
            ))}
            {stats.leaderboard.length === 0 && (
              <p className="muted" style={{ padding: 8 }}>No Top 50 rankings recorded yet.</p>
            )}
          </div>
        </div>

        <div className="dashboard-top-grid-cell">
          <h2 className="section-title">Deal split by type</h2>
          <div className="card" style={{ padding: '16px 20px' }}>
            {dealSplitSorted.length <= 3 ? (
              <>
                <p className="muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 8 }}>
                  {formatUSDM(stats.totalRaisedM)} total capital tracked
                </p>
                <DonutChart
                  segments={dealSplitSorted.map((d) => ({ label: d.dealType, value: d.amount }))}
                  centerValue={formatUSDM(stats.totalRaisedM)}
                  centerLabel="tracked"
                  legendSuffix={(v) => formatUSDM(v)}
                />
              </>
            ) : (
              <RankedList
                items={dealSplitSorted.map((d) => ({ label: d.dealType, value: d.amount }))}
                formatValue={formatUSDM}
              />
            )}
          </div>
        </div>

        <div className="dashboard-top-grid-cell dashboard-top-grid-cell-tall">
          <h2 className="section-title">Companies by vertical</h2>
          <div className="card" style={{ padding: '4px 20px' }}>
            <RankedList
              items={stats.verticalBreakdown.map((v) => ({ label: v.vertical, value: v.companies }))}
              formatValue={formatNumber}
              linkTo={(item) => `/vertical/${encodeURIComponent(item.label)}`}
            />
          </div>
        </div>

        <div className="dashboard-top-grid-cell">
          <h2 className="section-title">Companies by stage</h2>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, flex: 1, alignItems: 'center' }}>
            {stageReal.map((group) => (
              <div key={group.stage} className="stage-chip">
                <span className="metric-label">{group.stage}</span>
                <span className="metric-value">{group.companies}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-top-grid-cell">
          <h2 className="section-title">Investment by region</h2>
          <div className="card" style={{ padding: '4px 20px' }}>
            <RankedList
              items={regionsRanked.map((r) => ({ label: r.region, value: r.amount }))}
              formatValue={formatUSDM}
              footnote={regionUnspecified ? { label: 'Unspecified (unmapped)', value: regionUnspecified.amount } : null}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: -16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="section-title">Investment over time</h2>
          {stats.undatedInvestmentM > 0 && (
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              + {formatUSDM(stats.undatedInvestmentM)} with no date on record
            </span>
          )}
        </div>
        <div className="card" style={{ padding: '20px 24px 12px' }}>
          <InvestmentTimeline data={stats.investmentByYear} formatValue={formatUSDM} />
        </div>
      </div>
    </div>
  );
}
