export function ScoreArc({ value, max = 300, size = 96 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, (value || 0) / max);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(67, 40, 70, 0.12)"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--plum)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="num"
        style={{ fontSize: size * 0.21, fontWeight: 600, fill: 'var(--ink)' }}
      >
        {value}
      </text>
    </svg>
  );
}
