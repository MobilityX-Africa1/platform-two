import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useNotionData } from '../hooks/useNotionData';
import { useStats } from '../hooks/useStats';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { CardSkeletonGrid, ListSkeleton } from '../components/Skeletons';
import { RankBadge } from '../components/RankBadge';
import { formatUSDM, formatNumber, displayStage } from '../lib/format';

const SLICE_COLORS = ['#4A2D4E', '#89CFF0', '#9BBB59', '#F4A28C'];

function VerticalBarShape(props) {
  const { x, y, width, height, fill, stroke, strokeWidth, radius, parentViewBox } = props;
  const dropX = x + width;
  const axisY = parentViewBox.y + parentViewBox.height;

  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        radius={radius}
      />
      <line
        x1={dropX}
        y1={y + height / 2}
        x2={dropX}
        y2={axisY}
        stroke="var(--coral)"
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
    </g>
  );
}

export function DashboardPage() {
  const { status } = useNotionData();
  const stats = useStats();
  const navigate = useNavigate();

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

  return (
    <div className="stack" style={{ gap: 40 }}>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p style={{ marginTop: 8 }}>
          Live snapshot of the African e-mobility ecosystem — Countries, Companies, and Capital.
        </p>
      </div>

      <MetricGrid>
        <MetricCard label="Companies tracked" value={formatNumber(stats.companiesTracked)} />
        <MetricCard label="Total investment tracked" value={formatUSDM(stats.totalRaisedM)} />
        <MetricCard label="Countries represented" value={formatNumber(stats.countriesTracked)} />
        <MetricCard label="Capital allocators" value={formatNumber(stats.activeAllocators)} />
      </MetricGrid>

      <div className="row" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 className="section-title">Top 5 leaderboard</h2>
          <div
            className="card stack"
            style={{ padding: '10px 12px', height: 180, gap: 2, justifyContent: 'center' }}
          >
            {stats.leaderboard.map((c) => (
              <Link
                key={c.id}
                to={`/company/${c.id}`}
                className="list-row"
                style={{ padding: '2px var(--space-3)', fontSize: 'var(--text-sm)' }}
              >
                <RankBadge rank={c.rankingOrder} />
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                {c.stage && (
                  <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                    {displayStage(c.stage)}
                  </span>
                )}
              </Link>
            ))}
            {stats.leaderboard.length === 0 && (
              <p className="muted" style={{ padding: 8 }}>No Top 50 rankings recorded yet.</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 className="section-title">Deal split by type</h2>
          <div className="card" style={{ padding: 12, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dealSplitSorted}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                barCategoryGap="24%"
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickFormatter={(v) => formatUSDM(v)}
                  tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  dataKey="dealType"
                  type="category"
                  width={92}
                  tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
                  {dealSplitSorted.map((entry, i) => (
                    <Cell key={entry.dealType} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 className="section-title">Investment by year</h2>
          <div className="card" style={{ padding: 12, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.investmentByYear}
                margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
                barCategoryGap="28%"
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  allowDecimals={false}
                  width={44}
                  tickFormatter={(v) => formatUSDM(v)}
                  tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                <Bar dataKey="amount" fill="var(--sky)" radius={[4, 4, 0, 0]} barSize={22} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 className="section-title">Investment by region</h2>
          <div className="card" style={{ padding: 12, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.investmentByRegion}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                barCategoryGap="24%"
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickFormatter={(v) => formatUSDM(v)}
                  tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  dataKey="region"
                  type="category"
                  width={92}
                  tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={false} formatter={(value) => formatUSDM(value)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
                  {stats.investmentByRegion.map((entry, i) => (
                    <Cell key={entry.region} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginTop: -13 }}>
        <h2 className="section-title">Companies by vertical</h2>
        <div className="card" style={{ padding: 16, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.verticalBreakdown}
              layout="vertical"
              margin={{ left: 24, bottom: 4 }}
              barCategoryGap="16%"
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                tickCount={6}
                tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                dataKey="vertical"
                type="category"
                width={170}
                tick={{ fontSize: 12, fill: 'var(--text-2)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={false} content={() => null} />
              <Bar
                dataKey="companies"
                fill="var(--sky)"
                radius={[0, 4, 4, 0]}
                barSize={16}
                cursor="pointer"
                isAnimationActive={false}
                onClick={(entry) => navigate(`/vertical/${encodeURIComponent(entry.vertical)}`)}
                shape={<VerticalBarShape />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="section-title">Companies by stage</h2>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {stats.stageBreakdown.map((group) => (
            <div key={group.stage} className="stage-chip">
              <span className="metric-label">{group.stage}</span>
              <span className="metric-value">{group.companies}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
