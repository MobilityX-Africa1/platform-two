import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { MetricCard, MetricGrid } from '../components/MetricCard';
import { MarketComparisonTable } from '../components/MarketComparisonTable';
import { CountryFlag } from '../components/CountryFlag';
import { getField } from '../lib/normalize';
import { formatMoney, formatNumber } from '../lib/format';
import { violetShade } from '../lib/assetEconomics';
import { jumpToSection } from '../lib/sectionJump';
import { Row } from '../components/DataTableRow';

function LollipopMark({ x, y, width, height, payload, fill }) {
  const cy = y + height / 2;
  const radius = 4.5;
  const x2 = x + width;
  return (
    <g>
      <line x1={x} y1={cy} x2={x2} y2={cy} stroke={fill} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x2} cy={cy} r={radius} fill={fill} />
      <text
        x={x2 + radius + 6}
        y={cy}
        dy={3.5}
        fontSize={11}
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
    <div className="stack page-stack">
      <div className="page-header">
        <span className="eyebrow page-eyebrow" data-pillar="economics">TCO analysis</span>
        <h1>Asset Economics</h1>
        <p>
          EV vs. ICE two-wheeler total cost of ownership across {economics.length} markets —
          fuel/electricity prices, financing, running costs, and 3-year TCO.
        </p>
      </div>

      <MetricGrid>
        <MetricCard
          label="Markets covered"
          value={formatNumber(economics.length)}
          onClick={() => jumpToSection('econ-markets')}
          actionHint="jump to the market comparison"
        />
        <MetricCard
          label="Avg annual savings, EV vs ICE"
          value={money(average(economics, 'Annual Savings EV vs ICE USD'))}
          valueClassName="text-indigo"
          onClick={() => jumpToSection('econ-savings')}
          actionHint="jump to annual savings by market"
        />
        <MetricCard
          label="Avg cost per km, EV"
          value={money3(average(economics, 'Cost per km EV USD'))}
          onClick={() => jumpToSection('econ-cost-per-km')}
          actionHint="jump to cost per km by market"
        />
        <MetricCard
          label="Avg cost per km, ICE"
          value={money3(average(economics, 'Fuel Cost per km ICE USD'))}
          onClick={() => jumpToSection('econ-cost-per-km')}
          actionHint="jump to cost per km by market"
        />
      </MetricGrid>

      {chartData.length > 0 && (
        <section>
          <h2 className="section-title" id="econ-savings">Annual savings, EV vs. ICE, by market</h2>
          <div className="card" style={{ padding: '8px 10px', height: Math.max(160, chartData.length * 19) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 70, top: 2, bottom: 2 }}
                barCategoryGap="20%"
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
                  height={20}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={96}
                  interval={0}
                  tick={{ fontSize: 10, fill: '#0b0b0b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="savings" barSize={14} isAnimationActive={false} shape={LollipopMark}>
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
        <h2 className="section-title" style={{ marginTop: 2 }} id="econ-markets">Annual cost of ownership, ICE vs. EV, 2W</h2>
        <MarketComparisonTable markets={sorted} />
      </section>

      {/* Per-market values behind the two "Avg cost per km" cards, in the same
          market order as the comparison above. */}
      <section>
        <h2 className="section-title" id="econ-cost-per-km">Cost per km by market</h2>
        <div className="econ-scope">
          <div className="econ-table-wrap">
            <table className="econ-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>ICE / km</th>
                  <th>EV / km</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <Row key={m.id} to={`/asset-economics/${m.id}`}>
                    <td className="econ-market-name">
                      <span className="row" style={{ gap: 8 }}>
                        <CountryFlag name={m.name} size={16} />
                        {m.name}
                      </span>
                    </td>
                    <td className="econ-num-cell econ-ice-cell">{money3(getField(m, 'Fuel Cost per km ICE USD'))}</td>
                    <td className="econ-num-cell econ-ev-cell">{money3(getField(m, 'Cost per km EV USD'))}</td>
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
