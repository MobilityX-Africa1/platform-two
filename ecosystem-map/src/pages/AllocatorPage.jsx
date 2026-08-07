import { useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CompanyLogo } from '../components/CompanyLogo';
import { formatUSD } from '../lib/format';

function ChipList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {items.map((i) => (
        <span key={i} className="chip chip-neutral">
          {i}
        </span>
      ))}
    </div>
  );
}

export function AllocatorPage() {
  const { id } = useParams();
  const { allocators, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const allocator = allocators.find((a) => a.id === id);
  if (!allocator) return <p>Capital allocator not found.</p>;

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="row page-header" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <CompanyLogo name={allocator.name} website={allocator.website} size={44} />
        <h1>{allocator.name}</h1>
        <span className="chip chip-neutral">{allocator.typeOfInvestor}</span>
        {allocator.aMINMember && <span className="chip chip-upstream">AMIN member</span>}
      </div>

      <div style={{ marginTop: -24 }}>
        {allocator.organisationSummary && <p style={{ marginTop: 0 }}>{allocator.organisationSummary}</p>}
        <p style={{ marginTop: 8 }}>
          {allocator.typicalInvestmentSizeUSD != null &&
            `Typical ticket: ${formatUSD(allocator.typicalInvestmentSizeUSD)}`}
          {allocator.website && (
            <>
              {allocator.typicalInvestmentSizeUSD != null && ' · '}
              <a
                href={allocator.website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--plum)', fontWeight: 600 }}
              >
                Website{' '}
                <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            </>
          )}
        </p>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <span className="metric-label">Portfolio companies</span>
          <span className="metric-value">{allocator.portfolio?.length ?? 0}</span>
        </div>
      </div>

      <section>
        <h2 className="section-title">Geographic focus</h2>
        <ChipList items={allocator.geo} />
        {(!allocator.geo || allocator.geo.length === 0) && <p className="muted">Not recorded yet.</p>}
      </section>

      {(allocator.investmentInstrument || []).length > 0 && (
        <section>
          <h2 className="section-title">Investment instrument</h2>
          <ChipList items={allocator.investmentInstrument} />
        </section>
      )}

      {(allocator.focusAreas || []).length > 0 && (
        <section>
          <h2 className="section-title">Focus areas</h2>
          <ChipList items={allocator.focusAreas} />
        </section>
      )}

      {(allocator.mobilitySubVertical || []).length > 0 && (
        <section>
          <h2 className="section-title">Mobility sub-verticals</h2>
          <ChipList items={allocator.mobilitySubVertical} />
        </section>
      )}
    </div>
  );
}
