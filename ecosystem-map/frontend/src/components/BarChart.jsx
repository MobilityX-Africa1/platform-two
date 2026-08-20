import { useLayoutEffect, useRef, useState } from 'react';

const HEIGHT = 148;
const GAP = 12;
const LABEL_H = 22;
const VALUE_GAP = 16;
const DEFAULT_WIDTH = 280;

// Small categorical bar chart (e.g. "companies by stage") — one bar per
// category, the tallest bar highlighted in the brand color and the rest in
// a neutral gray, direct value labels instead of a Y axis. Mirrors the
// self-measuring width pattern used by Sparkline/InvestmentTimeline so it
// stays responsive inside a card without a fixed pixel width.
export function BarChart({ data, valueKey = 'value', labelKey = 'label', formatLabel = (l) => l }) {
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

  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const barWidth = Math.max((width - GAP * (data.length - 1)) / data.length, 10);
  const plotHeight = HEIGHT - LABEL_H - VALUE_GAP;
  const peakIndex = data.reduce((best, d, i) => (d[valueKey] > data[best][valueKey] ? i : best), 0);

  return (
    <div className="bar-chart" ref={containerRef}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="bar-chart-svg">
        {data.map((d, i) => {
          const x = i * (barWidth + GAP);
          const barHeight = Math.max((d[valueKey] / max) * plotHeight, 4);
          const y = VALUE_GAP + (plotHeight - barHeight);
          const isPeak = i === peakIndex;
          return (
            <g key={d[labelKey]}>
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="bar-chart-value">
                {d[valueKey]}
              </text>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={Math.min(barWidth / 2, 7)}
                className={`bar-chart-bar${isPeak ? ' bar-chart-bar-peak' : ''}`}
              />
              <text x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" className="bar-chart-label">
                {formatLabel(d[labelKey])}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
