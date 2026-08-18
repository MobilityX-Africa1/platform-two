// Trend line for a stat tile — thin stroke, soft fill to baseline, no axes,
// no per-point markers. Renders nothing if there isn't enough real history
// to plot (caller should omit the tile's delta too in that case, not fake a flat line).
export function Sparkline({ data, width = 96, height = 36, color = 'var(--plum)' }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data, 0);
  const max = Math.max(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const toY = (v) => height - ((v - min) / range) * height;

  const points = data.map((v, i) => [i * stepX, toY(v)]);
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradientId = `spark-fill-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
