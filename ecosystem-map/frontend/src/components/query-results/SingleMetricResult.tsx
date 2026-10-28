import { MetricCard, MetricGrid } from '../MetricCard';
import { CaveatsBanner } from './QueryResultShared';

export function SingleMetricResult({ result }) {
  const { summary, value, label, context, caveats } = result;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <p>{summary}</p>
      <MetricGrid>
        <MetricCard label={label} value={value} accent="plum" />
      </MetricGrid>
      {context && <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{context}</p>}
      <CaveatsBanner caveats={caveats} />
    </div>
  );
}
