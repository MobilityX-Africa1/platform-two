// Only the app's two brand chart colors (plum, sky) — a third slot falls
// back to a darker sky tint rather than introducing a new hue.
const DONUT_COLORS = ['var(--plum)', 'var(--sky)', 'var(--sky-dark)'];

const SIZE = 148;
const CENTER = SIZE / 2;
const RADIUS = 52;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // px of empty ring between segments, for ≥2 segments

export function DonutChart({ segments, centerValue, centerLabel, legendSuffix }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const gap = segments.length > 1 ? GAP : 0;

  // Precompute each segment's cumulative start offset before rendering,
  // via reduce rather than mutating a running total inside the render map.
  const arcs = segments.reduce((acc, seg) => {
    const prevEnd = acc.length ? acc[acc.length - 1].end : 0;
    const pct = total ? seg.value / total : 0;
    const raw = pct * CIRCUMFERENCE;
    acc.push({ ...seg, dash: Math.max(raw - gap, 0), offset: -(prevEnd + gap / 2), end: prevEnd + raw });
    return acc;
  }, []);

  return (
    <div className="donut-chart-row">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="donut-chart">
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {arcs.map((seg, i) => (
            <circle
              key={seg.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text x={CENTER} y={CENTER - 5} textAnchor="middle" className="donut-center-value">
          {centerValue}
        </text>
        <text x={CENTER} y={CENTER + 15} textAnchor="middle" className="donut-center-label">
          {centerLabel}
        </text>
      </svg>

      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={seg.label} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <div className="donut-legend-text">
              <span className="donut-legend-name">{seg.label}</span>
              <span className="donut-legend-detail">
                {total ? Math.round((seg.value / total) * 100) : 0}% · {legendSuffix ? legendSuffix(seg.value) : seg.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
