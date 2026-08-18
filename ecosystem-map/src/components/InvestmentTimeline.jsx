import { useLayoutEffect, useRef, useState } from 'react';

const HEIGHT = 180;
const PAD_TOP = 46;
const PAD_SIDE = 30;
const PAD_BOTTOM = 10;
const DEFAULT_WIDTH = 640;

// Single-series trend line, direct value labels instead of a Y axis, and a
// callout annotation on the peak point. Points with no date on the source
// record are excluded from the line entirely (see `undatedAmount`/`undatedLabel`
// footnote) rather than invented into a fake time bucket.
//
// The SVG's viewBox width is kept equal to its measured pixel width (rather
// than stretching a fixed viewBox via preserveAspectRatio="none") so circles
// and text don't get scaled non-uniformly into ellipses/warped glyphs at
// wide card widths.
export function InvestmentTimeline({ data, formatValue }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.amount);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotWidth = width - PAD_SIDE * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    ...d,
    x: PAD_SIDE + i * stepX,
    y: PAD_TOP + plotHeight - ((d.amount - min) / range) * plotHeight,
  }));

  const peakIndex = values.indexOf(max);
  const peak = points[peakIndex];

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${HEIGHT - PAD_BOTTOM} L${points[0].x.toFixed(1)},${HEIGHT - PAD_BOTTOM} Z`;

  const annotationY = Math.max(peak.y - 26, 14);
  const annotationLineStartX = Math.max(peak.x - 150, PAD_SIDE);

  return (
    <div className="timeline-chart" ref={containerRef}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="timeline-svg">
        <defs>
          <linearGradient id="timeline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--plum)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--plum)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={fillPath} fill="url(#timeline-fill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--plum)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => {
          const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
          const labelX = i === 0 ? p.x - 4 : i === points.length - 1 ? p.x + 4 : p.x;
          return (
            <g key={p.year}>
              <circle cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke="var(--plum)" strokeWidth="2" />
              {i !== peakIndex && (
                <text x={labelX} y={p.y - 12} textAnchor={anchor} className="timeline-point-label">
                  {formatValue(p.amount)}
                </text>
              )}
            </g>
          );
        })}

        {/* peak callout */}
        <line
          x1={annotationLineStartX}
          y1={annotationY}
          x2={peak.x}
          y2={annotationY}
          stroke="var(--muted)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {annotationY < peak.y - 4 && (
          <line x1={peak.x} y1={annotationY} x2={peak.x} y2={peak.y - 6} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <text x={annotationLineStartX} y={annotationY - 6} textAnchor="start" className="timeline-peak-label">
          {formatValue(peak.amount)} — strongest year on record
        </text>
      </svg>

      <div className="timeline-axis" style={{ padding: `0 ${PAD_SIDE}px` }}>
        {points.map((p) => (
          <span key={p.year}>{p.year}</span>
        ))}
      </div>
    </div>
  );
}
