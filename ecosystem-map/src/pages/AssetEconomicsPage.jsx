import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { MarketComparisonTable } from '../components/MarketComparisonTable';
import { getField } from '../lib/normalize';
import { formatMoney, formatNumber } from '../lib/format';
import { violetShade } from '../lib/assetEconomics';

function LollipopMark({ x, y, width, height, payload, fill }) {
  const cy = y + height / 2;
  const radius = 6;
  const x2 = x + width;
  return (
    <g>
      <line x1={x} y1={cy} x2={x2} y2={cy} stroke={fill} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={x2} cy={cy} r={radius} fill={fill} />
      <text
        x={x2 + radius + 8}
        y={cy}
        dy={4}
        fontSize={12}
        fontFamily="var(--font-mono)"
        fill="#0b0b0b"
      >
        {formatMoney(payload.savings)}
      </text>
    </g>
  );
}

const money = (v) => formatMoney(v);
const money3 = (v) => formatMoney(v, 3);

function average(records, label) {
  const vals = records.map((r) => getField(r, label)).filter((v) => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function AssetEconomicsPage() {
  const { economics, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const sorted = [...economics].sort(
    (a, b) => (getField(b, 'Annual Savings EV vs ICE USD') ?? 0) - (getField(a, 'Annual Savings EV vs ICE USD') ?? 0),
  );
  const chartData = sorted.map((r) => ({
    name: r.name,
    savings: getField(r, 'Annual Savings EV vs ICE USD') ?? 0,
  }));
  const savingsValues = chartData.map((d) => d.savings);
  const minSavings = Math.min(...savingsValues, 0);
  const maxSavings = Math.max(...savingsValues, 0);
  const savingsRange = maxSavings - minSavings || 1;
  const AXIS_STEP = 750;
  const axisMax = Math.max(AXIS_STEP, Math.ceil(maxSavings / AXIS_STEP) * AXIS_STEP);
  const axisTicks = Array.from({ length: axisMax / AXIS_STEP + 1 }, (_, i) => i * AXIS_STEP);

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="page-header">
        <span className="eyebrow">TCO analysis</span>
        <h1>Asset Economics</h1>
        <p style={{ marginTop: 8 }}>
          EV vs. ICE two-wheeler total cost of ownership across {economics.length} markets —
          fuel/electricity prices, financing, running costs, and 3-year TCO.
        </p>
      </div>

      <MetricGrid>
        <MetricCard label="Markets covered" value={formatNumber(economics.length)} />
        <MetricCard label="Avg annual savings, EV vs ICE" value={money(average(economics, 'Annual Savings EV vs ICE USD'))} />
        <MetricCard label="Avg cost per km, EV" value={money3(average(economics, 'Cost per km EV USD'))} />
        <MetricCard label="Avg cost per km, ICE" value={money3(average(economics, 'Fuel Cost per km ICE USD'))} />
      </MetricGrid>

      {chartData.length > 0 && (
        <section>
          <h2 className="section-title">Annual savings, EV vs. ICE, by market</h2>
          <div className="card" style={{ padding: 12, height: Math.max(240, chartData.length * 28) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 70, top: 4, bottom: 4 }}
                barCategoryGap="24%"
              >
                <CartesianGrid horizontal={false} stroke="#e1e0d9" syncWithTicks />
                <ReferenceLine x={0} stroke="#c3c2b7" strokeWidth={1.5} isFront={false} />
                <XAxis
                  type="number"
                  domain={[0, axisMax]}
                  ticks={axisTicks}
                  allowDecimals={false}
                  tickFormatter={(v) => money(v)}
                  tick={{ fontSize: 10, fill: '#898781', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={96}
                  tick={{ fontSize: 11, fill: '#0b0b0b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="savings" barSize={24} isAnimationActive={false} shape={LollipopMark}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={violetShade((entry.savings - minSavings) / savingsRange)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <span className="eyebrow">Asset economics — market comparison</span>
        <h2 style={{ marginTop: 4, marginBottom: 16 }}>Annual cost of ownership, ICE vs. EV, 2W</h2>
        <MarketComparisonTable markets={sorted} />
      </section>
    </div>
  );
}
