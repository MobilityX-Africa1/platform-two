import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink, Users, Building2, UserRound, Smartphone, ShieldCheck, TrendingUp,
  Zap, Plug, PlugZap, Battery, RefreshCw, Link2, Car, CarFront, Fuel, Factory,
  Rocket, Users2,
} from 'lucide-react';
import { useNotionData } from '../hooks/useNotionData';
import { RankBadge } from '../components/RankBadge';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { CompanyLogo } from '../components/CompanyLogo';
import { Breadcrumb } from '../components/Breadcrumb';
import { Row } from '../components/DataTableRow';
import {
  displayStage, formatMoney, formatNumber, formatPercent, formatDate, statusChipClass,
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
  { label: 'Population (M)', fmt: withSuffix('M'), icon: Users },
  { label: 'Urbanisation rate (%)', fmt: percent, icon: Building2 },
  { label: 'Median age', fmt: withSuffix(' yrs'), icon: UserRound },
  { label: 'Mobile money penetration (%)', fmt: percent, icon: Smartphone },
];

const POLICY_ROWS = [
  { label: 'EV policy status', fmt: text, icon: ShieldCheck },
  { label: 'Policy trend', fmt: text, icon: TrendingUp },
];

const INFRASTRUCTURE_ROWS = [
  { label: 'Grid reliability', fmt: text, icon: Zap },
  { label: 'Charging points', fmt: num, icon: Plug },
  { label: 'Charging standards', fmt: text, icon: PlugZap },
  { label: 'Swap stations', display: 'Swap stations (physical count, where known)', fmt: num, icon: Battery },
  { label: 'Known swap station count', display: 'Known swap station count (companies)', fmt: num, icon: RefreshCw },
  { label: 'Interoperability standards', fmt: num, icon: Link2 },
  { label: 'Vehicles per 1,000', fmt: num, icon: Car },
  { label: 'EV fleet size (est.)', fmt: num, icon: CarFront },
];

// Petrol price / Fuel price and Electricity price / Energy price are
// confirmed-distinct, independently-sourced figures (CHANGES.md §7) — both
// sides of each pair are always shown, never merged.
const FUEL_ENERGY_ROWS = [
  { label: 'Petrol price', display: 'Petrol price — sourced', fmt: perLitre, icon: Fuel },
  { label: 'Fuel price (USD/L)', display: 'Fuel price — estimate', fmt: perLitre, icon: Fuel },
  { label: 'Electricity price', display: 'Electricity price — sourced', fmt: perKwh, icon: Zap },
  { label: 'Energy price (USD/kWh)', display: 'Energy price — estimate', fmt: perKwh, icon: Zap },
];

const ECOSYSTEM_ROWS = [
  { label: 'Active OEMs', fmt: text, icon: Factory },
  { label: 'Active accelerators', fmt: text, icon: Rocket },
  { label: 'E-mobility associations', fmt: text, icon: Users2 },
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

// A row whose formatter is the bare `text` passthrough is carrying a
// qualitative/status value ("Active", "Improving", a spec string) rather
// than a number — those render as a colored chip instead of bold plain text,
// so a section reads at a glance instead of as a wall of identical rows.
function FieldGrid({ record, rows }) {
  return (
    <div className="section-table-wrap">
      <table className="section-table">
        <tbody>
          {rows.map(({ label, display, fmt, icon: Icon }) => {
            const raw = getField(record, label);
            const isQualitative = fmt === text;
            return (
              <tr key={label}>
                <td>
                  <span className="row" style={{ gap: 6, color: 'var(--muted)' }}>
                    {Icon && <Icon size={14} style={{ flexShrink: 0 }} aria-hidden="true" />}
                    <span>{display || label}</span>
                  </span>
                </td>
                <td className={isQualitative ? 'section-table-chip-cell' : undefined} style={{ fontWeight: 600 }}>
                  {isQualitative ? (
                    raw ? <span className={`chip ${statusChipClass(raw)}`}>{raw}</span> : <span className="muted">—</span>
                  ) : (
                    fmt(raw)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
    <div className="stack" style={{ gap: 24 }}>
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

      <div className="stat-tile-grid">
        <div className="stat-tile">
          <span className="stat-tile-label">EV penetration</span>
          <span className="stat-tile-value accent">
            {country.eVPenetration != null ? `${country.eVPenetration}%` : '—'}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Active companies</span>
          <span className="stat-tile-value">{country.companies?.length ?? 0}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Dominant vehicle</span>
          <span className="stat-tile-value" style={{ fontSize: 'var(--text-md)' }}>
            {country.dominantVehicleCategory || '—'}
          </span>
        </div>
        {country.populationM != null && (
          <div className="stat-tile">
            <span className="stat-tile-label">Population</span>
            <span className="stat-tile-value">{formatNumber(country.populationM)}M</span>
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
          <FieldGrid record={country} rows={DEMOGRAPHIC_ROWS} />
        </section>
      )}

      {(hasAnyField(country, POLICY_ROWS) || POLICY_NOTES.some((l) => getField(country, l))) && (
        <section>
          <h2 className="section-title">Policy & regulation</h2>
          <FieldGrid record={country} rows={POLICY_ROWS} />
          <NoteList record={country} labels={POLICY_NOTES} />
        </section>
      )}

      {hasAnyField(country, INFRASTRUCTURE_ROWS) && (
        <section>
          <h2 className="section-title">Infrastructure</h2>
          <FieldGrid record={country} rows={INFRASTRUCTURE_ROWS} />
        </section>
      )}

      {hasAnyField(country, FUEL_ENERGY_ROWS) && (
        <section>
          <h2 className="section-title">Fuel & energy pricing</h2>
          <FieldGrid record={country} rows={FUEL_ENERGY_ROWS} />
          {country.contextNotes && (
            <p className="muted" style={{ fontSize: 'var(--text-xs)', marginTop: 12, marginBottom: 0 }}>
              {country.contextNotes}
            </p>
          )}
        </section>
      )}

      {country.economics && (
        <section>
          <h2 className="section-title">TCO analysis</h2>
          <div className="card" style={{ padding: 16 }}>
            <div className="stat-tile-grid">
              <div className="stat-tile">
                <span className="stat-tile-label">Annual savings, EV vs ICE</span>
                <span className="stat-tile-value accent-indigo">
                  {formatMoney(getField(country.economics, 'Annual Savings EV vs ICE USD'))}
                </span>
              </div>
              <div className="stat-tile">
                <span className="stat-tile-label">Cost per km, EV</span>
                <span className="stat-tile-value">
                  {formatMoney(getField(country.economics, 'Cost per km EV USD'), 3)}
                </span>
              </div>
              <div className="stat-tile">
                <span className="stat-tile-label">Cost per km, ICE</span>
                <span className="stat-tile-value">
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
              <div className="data-table-wrap">
                <table className="data-table">
                  <tbody>
                    {group.companies.map((c) => (
                      <Row key={c.id} to={`/company/${c.id}`}>
                        <td className="data-table-name">
                          <RankBadge rank={c.rankingOrder} />
                          <CompanyLogo name={c.name} website={c.website} size={24} />
                          <span>{c.name}</span>
                        </td>
                        <td className="data-table-chip-cell">
                          {c.stage && <span className="chip chip-neutral">{displayStage(c.stage)}</span>}
                        </td>
                      </Row>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {companiesByVertical.length === 0 && <p>No companies tracked in this country yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title">Investors active here</h2>
        {activeAllocators.length === 0 ? (
          <p style={{ padding: 12 }}>No allocators mapped to this market yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <tbody>
                {activeAllocators.map((a) => (
                  <Row key={a.id} to={`/allocator/${a.id}`}>
                    <td className="data-table-name">
                      <CompanyLogo name={a.name} website={a.website} size={28} />
                      <span>{a.name}</span>
                    </td>
                    <td className="data-table-chip-cell">
                      <span className="chip chip-neutral">{a.typeOfInvestor}</span>
                    </td>
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hasAnyField(country, ECOSYSTEM_ROWS) || ECOSYSTEM_NOTES.some((l) => getField(country, l)) ? (
        <section>
          <h2 className="section-title">Ecosystem notes</h2>
          <FieldGrid record={country} rows={ECOSYSTEM_ROWS} />
          <NoteList record={country} labels={ECOSYSTEM_NOTES} />
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
