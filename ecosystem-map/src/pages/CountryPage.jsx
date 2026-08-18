import { useParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { RankBadge } from '../components/RankBadge';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { CompanyLogo } from '../components/CompanyLogo';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  displayStage, formatMoney, formatNumber, formatPercent, formatDate,
} from '../lib/format';
import { getField } from '../lib/normalize';

const num = (v) => formatNumber(v);
const percent = (v) => formatPercent(v, 1);
const text = (v) => v || '—';
const withSuffix = (suffix) => (v) => (v == null ? '—' : `${formatNumber(v)}${suffix}`);
const perLitre = (v) => (v == null ? '—' : `${formatMoney(v, 2)}/L`);
const perKwh = (v) => (v == null ? '—' : `${formatMoney(v, 2)}/kWh`);

// Field groups mirror the Notion "Countries" schema section by section —
// labels are the exact Notion property names so getField() can resolve them
// without hand-typing camelCase keys. A group only renders once at least one
// of its rows has data, so stub/low-priority markets don't show a wall of "—".
//
// GDP per capita, Regulatory body, Government ministry, and the whole
// Investment Landscape group (Total capital deployed, Debt pricing, Dominant
// funding instrument, Typical ticket size range, Key DFIs present, Active
// investors) are internal-only per CHANGES.md §7 and must never appear here —
// see api/notion.js's PUBLIC_FIELDS allow-list, which is the real enforcement
// point; these UI-side omissions are belt-and-suspenders.
const DEMOGRAPHIC_ROWS = [
  { label: 'Population (M)', fmt: withSuffix('M') },
  { label: 'Urbanisation rate (%)', fmt: percent },
  { label: 'Median age', fmt: withSuffix(' yrs') },
  { label: 'Mobile money penetration (%)', fmt: percent },
];

const POLICY_ROWS = [
  { label: 'EV policy status', fmt: text },
  { label: 'Policy trend', fmt: text },
];

const INFRASTRUCTURE_ROWS = [
  { label: 'Grid reliability', fmt: text },
  { label: 'Charging points', fmt: num },
  { label: 'Charging standards', fmt: text },
  { label: 'Swap stations', display: 'Swap stations (physical count, where known)', fmt: num },
  { label: 'Known swap station count', display: 'Known swap station count (companies)', fmt: num },
  { label: 'Interoperability standards', fmt: num },
  { label: 'Vehicles per 1,000', fmt: num },
  { label: 'EV fleet size (est.)', fmt: num },
];

// Petrol price / Fuel price and Electricity price / Energy price are
// confirmed-distinct, independently-sourced figures (CHANGES.md §7) — both
// sides of each pair are always shown, never merged.
const FUEL_ENERGY_ROWS = [
  { label: 'Petrol price', display: 'Petrol price — sourced', fmt: perLitre },
  { label: 'Fuel price (USD/L)', display: 'Fuel price — estimate', fmt: perLitre },
  { label: 'Electricity price', display: 'Electricity price — sourced', fmt: perKwh },
  { label: 'Energy price (USD/kWh)', display: 'Energy price — estimate', fmt: perKwh },
];

const ECOSYSTEM_ROWS = [
  { label: 'Active OEMs', fmt: text },
  { label: 'Active accelerators', fmt: text },
  { label: 'E-mobility associations', fmt: text },
];

// Longer freeform fields read as narrative rather than scalar stats, so they
// render as paragraphs under their section instead of a grid row.
const POLICY_NOTES = ['EV incentives', 'EV targets'];
const ECOSYSTEM_NOTES = ['Key use cases'];

function hasAnyField(record, rows) {
  return rows.some((r) => {
    const v = getField(record, r.label);
    return v != null && v !== '';
  });
}

function FieldGrid({ record, rows }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '2px 24px',
      }}
    >
      {rows.map(({ label, display, fmt }) => (
        <div
          key={label}
          className="row"
          style={{
            justifyContent: 'space-between',
            gap: 8,
            padding: '5px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <span className="muted">{display || label}</span>
          <span className="num" style={{ fontWeight: 600, textAlign: 'right' }}>{fmt(getField(record, label))}</span>
        </div>
      ))}
    </div>
  );
}

function NoteList({ record, labels }) {
  const present = labels.filter((label) => getField(record, label));
  if (present.length === 0) return null;
  return (
    <div className="stack" style={{ gap: 8, marginTop: 12 }}>
      {present.map((label) => (
        <p key={label} style={{ margin: 0 }}>
          <span className="muted" style={{ fontWeight: 600 }}>{label}: </span>
          {getField(record, label)}
        </p>
      ))}
    </div>
  );
}

export function CountryPage() {
  const { id } = useParams();
  const { countries, allocators, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={8} />;

  const country = countries.find((c) => c.id === id);
  if (!country) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <p>Country not found.</p>
        <Breadcrumb to="/countries" label="Countries" />
      </div>
    );
  }

  const activeAllocators = allocators.filter((a) =>
    (a.markets || []).some((m) => m.id === country.id),
  );

  const companiesByVertical = Object.values(
    (country.companies || []).reduce((acc, c) => {
      for (const v of c.vertical?.length ? c.vertical : ['Unspecified']) {
        if (!acc[v]) acc[v] = { vertical: v, companies: [] };
        acc[v].companies.push(c);
      }
      return acc;
    }, {}),
  );

  return (
    <div className="stack" style={{ gap: 32 }}>
      <Breadcrumb to="/countries" label="Countries" />
      <div className="row page-header" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <CountryFlag name={country.name} size={40} />
        <div>
          <h1>{country.name}</h1>
          <span className="muted">
            {country.region}
            {country.capitalCity && ` · ${country.capitalCity}`}
          </span>
        </div>
        {country.tier && <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>{country.tier}</span>}
        {country.platformPriority && (
          <span className="chip chip-neutral">{country.platformPriority} priority</span>
        )}
        {country.marketMaturity && <span className="chip chip-neutral">{country.marketMaturity}</span>}
      </div>

      <div className="stat-row-plain">
        <div className="stat">
          <span className="metric-label">EV penetration</span>
          <span className="metric-value">
            {country.eVPenetration != null ? `${country.eVPenetration}%` : '—'}
          </span>
        </div>
        <div className="stat">
          <span className="metric-label">Active companies</span>
          <span className="metric-value">{country.companies?.length ?? 0}</span>
        </div>
        <div className="stat">
          <span className="metric-label">Dominant vehicle</span>
          <span className="metric-value" style={{ fontSize: 'var(--text-md)' }}>
            {country.dominantVehicleCategory || '—'}
          </span>
        </div>
        {country.populationM != null && (
          <div className="stat">
            <span className="metric-label">Population</span>
            <span className="metric-value">{formatNumber(country.populationM)}M</span>
          </div>
        )}
      </div>

      {country.importDutyStatus && (
        <section>
          <h2 className="section-title">Policy status</h2>
          <p>{country.importDutyStatus}</p>
        </section>
      )}

      {country.marketNarrative && (
        <section>
          <h2 className="section-title">Market narrative</h2>
          <p>{country.marketNarrative}</p>
        </section>
      )}

      {hasAnyField(country, DEMOGRAPHIC_ROWS) && (
        <section>
          <h2 className="section-title">Demographics & economy</h2>
          <div className="card" style={{ padding: 16 }}>
            <FieldGrid record={country} rows={DEMOGRAPHIC_ROWS} />
          </div>
        </section>
      )}

      {(hasAnyField(country, POLICY_ROWS) || POLICY_NOTES.some((l) => getField(country, l))) && (
        <section>
          <h2 className="section-title">Policy & regulation</h2>
          <div className="card" style={{ padding: 16 }}>
            <FieldGrid record={country} rows={POLICY_ROWS} />
            <NoteList record={country} labels={POLICY_NOTES} />
          </div>
        </section>
      )}

      {hasAnyField(country, INFRASTRUCTURE_ROWS) && (
        <section>
          <h2 className="section-title">Infrastructure</h2>
          <div className="card" style={{ padding: 16 }}>
            <FieldGrid record={country} rows={INFRASTRUCTURE_ROWS} />
          </div>
        </section>
      )}

      {hasAnyField(country, FUEL_ENERGY_ROWS) && (
        <section>
          <h2 className="section-title">Fuel & energy pricing</h2>
          <div className="card" style={{ padding: 16 }}>
            <FieldGrid record={country} rows={FUEL_ENERGY_ROWS} />
            {country.contextNotes && (
              <p className="muted" style={{ fontSize: 'var(--text-xs)', marginTop: 12, marginBottom: 0 }}>
                {country.contextNotes}
              </p>
            )}
          </div>
        </section>
      )}

      {country.economics && (
        <section>
          <h2 className="section-title">TCO analysis</h2>
          <div className="card" style={{ padding: 16 }}>
            <div className="stat-row-plain" style={{ gap: 'var(--space-8) var(--space-6)' }}>
              <div className="stat">
                <span className="metric-label">Annual savings, EV vs ICE</span>
                <span className="metric-value">
                  {formatMoney(getField(country.economics, 'Annual Savings EV vs ICE USD'))}
                </span>
              </div>
              <div className="stat">
                <span className="metric-label">Cost per km, EV</span>
                <span className="metric-value">
                  {formatMoney(getField(country.economics, 'Cost per km EV USD'), 3)}
                </span>
              </div>
              <div className="stat">
                <span className="metric-label">Cost per km, ICE</span>
                <span className="metric-value">
                  {formatMoney(getField(country.economics, 'Fuel Cost per km ICE USD'), 3)}
                </span>
              </div>
            </div>
            <Link
              to={`/asset-economics/${country.economics.id}`}
              className="chip chip-neutral"
              style={{ marginTop: 16 }}
            >
              View full TCO analysis →
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Companies by vertical</h2>
        <div className="stack" style={{ gap: 20 }}>
          {companiesByVertical.map((group) => (
            <div key={group.vertical}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {group.vertical} · {group.companies.length}
              </div>
              <div className="card stack" style={{ padding: 8, gap: 0 }}>
                {group.companies.map((c) => (
                  <Link key={c.id} to={`/company/${c.id}`} className="list-row">
                    <RankBadge rank={c.rankingOrder} />
                    <CompanyLogo name={c.name} website={c.website} size={24} />
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.stage && (
                      <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                        {displayStage(c.stage)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {companiesByVertical.length === 0 && <p>No companies tracked in this country yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title">Investors active here</h2>
        <div className="card stack" style={{ padding: 8, gap: 0 }}>
          {activeAllocators.map((a) => (
            <Link key={a.id} to={`/allocator/${a.id}`} className="list-row">
              <CompanyLogo name={a.name} website={a.website} size={28} />
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>
                {a.typeOfInvestor}
              </span>
            </Link>
          ))}
          {activeAllocators.length === 0 && (
            <p style={{ padding: 12 }}>No allocators mapped to this market yet.</p>
          )}
        </div>
      </section>

      {hasAnyField(country, ECOSYSTEM_ROWS) || ECOSYSTEM_NOTES.some((l) => getField(country, l)) ? (
        <section>
          <h2 className="section-title">Ecosystem notes</h2>
          <div className="card" style={{ padding: 16 }}>
            <FieldGrid record={country} rows={ECOSYSTEM_ROWS} />
            <NoteList record={country} labels={ECOSYSTEM_NOTES} />
          </div>
        </section>
      ) : null}

      {(country.lastUpdated?.start || country.analysisPage) && (
        <div className="row muted" style={{ fontSize: 'var(--text-xs)', gap: 12, flexWrap: 'wrap' }}>
          {country.lastUpdated?.start && <span>Last updated {formatDate(country.lastUpdated)}</span>}
          {country.analysisPage && (
            <a href={country.analysisPage} target="_blank" rel="noreferrer" style={{ color: 'var(--plum)', fontWeight: 600 }}>
              Full analysis <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
