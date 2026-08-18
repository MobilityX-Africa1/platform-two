import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { getField } from '../lib/normalize';
import { formatMoney, formatNumber, formatPercent } from '../lib/format';

const MIN_COUNTRIES = 2;
const MAX_COUNTRIES = 4;

const num = (v) => formatNumber(v);
const percent = (v) => formatPercent(v, 1);
const text = (v) => v || '—';
const perLitre = (v) => (v == null ? '—' : `${formatMoney(v, 2)}/L`);
const perKwh = (v) => (v == null ? '—' : `${formatMoney(v, 2)}/kWh`);

// Labels match the exact Notion property names CountryPage.jsx already reads
// via getField(), and the same public-field allow-list from CHANGES.md §7 —
// no new fields invented here.
const FIELD_ROWS = [
  { label: 'Population', get: (c) => getField(c, 'Population (M)'), fmt: (v) => (v == null ? '—' : `${num(v)}M`) },
  { label: 'Urbanisation rate', get: (c) => getField(c, 'Urbanisation rate (%)'), fmt: percent },
  { label: 'Median age', get: (c) => getField(c, 'Median age'), fmt: (v) => (v == null ? '—' : `${num(v)} yrs`) },
  { label: 'Vehicles per 1,000', get: (c) => getField(c, 'Vehicles per 1,000'), fmt: num },
  { label: 'Active companies', get: (c) => c.companies?.length ?? 0, fmt: num },
  { label: 'EV policy status', get: (c) => getField(c, 'EV policy status'), fmt: text },
  { label: 'Import duty status', get: (c) => getField(c, 'Import duty status'), fmt: text },
  { label: 'Policy trend', get: (c) => getField(c, 'Policy trend'), fmt: text },
  { label: 'Known swap station count', get: (c) => getField(c, 'Known swap station count'), fmt: num },
  { label: 'Charging points', get: (c) => getField(c, 'Charging points'), fmt: num },
  { label: 'Petrol price — sourced', get: (c) => getField(c, 'Petrol price'), fmt: perLitre },
  { label: 'Fuel price — estimate', get: (c) => getField(c, 'Fuel price (USD/L)'), fmt: perLitre },
  { label: 'Electricity price — sourced', get: (c) => getField(c, 'Electricity price'), fmt: perKwh },
  { label: 'Energy price — estimate', get: (c) => getField(c, 'Energy price (USD/kWh)'), fmt: perKwh },
  {
    label: 'Annual savings, EV vs ICE',
    get: (c) => (c.economics ? getField(c.economics, 'Annual Savings EV vs ICE USD') : null),
    fmt: (v) => (v == null ? '—' : formatMoney(v)),
  },
];

export function CompareCountriesPage() {
  const { countries, status } = useNotionData();
  const [selectedIds, setSelectedIds] = useState([]);

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const publishedCountries = countries
    .filter((c) => c.publish === true)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selected = selectedIds
    .map((id) => publishedCountries.find((c) => c.id === id))
    .filter(Boolean);

  const atMax = selectedIds.length >= MAX_COUNTRIES;

  function toggle(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COUNTRIES) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="page-header">
        <h1>Compare Countries</h1>
        <p style={{ marginTop: 8 }}>
          Select 2–4 markets to compare demographics, policy, fuel &amp; energy pricing, and EV economics side by side.
        </p>
      </div>

      <section>
        <h2 className="section-title">Select markets</h2>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {publishedCountries.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            const disabled = !isSelected && atMax;
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                className={`filter-chip${isSelected ? ' selected' : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={() => toggle(c.id)}
              >
                <CountryFlag name={c.name} size={12} />
                {c.name}
              </button>
            );
          })}
        </div>
        {selectedIds.length < MIN_COUNTRIES && (
          <p className="muted" style={{ marginTop: 12 }}>
            Select at least {MIN_COUNTRIES} countries to compare.
          </p>
        )}
        {atMax && (
          <p className="muted" style={{ marginTop: 12 }}>
            Maximum of {MAX_COUNTRIES} countries — remove one to add another.
          </p>
        )}
      </section>

      {selected.length >= MIN_COUNTRIES && (
        <section>
          <h2 className="section-title">Comparison</h2>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th />
                  {selected.map((c) => (
                    <th key={c.id}>
                      <Link
                        to={`/country/${c.id}`}
                        className="row"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--plum)', fontWeight: 700, textTransform: 'none', letterSpacing: 0, fontSize: 'var(--text-sm)' }}
                      >
                        <CountryFlag name={c.name} size={14} />
                        {c.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELD_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="muted" style={{ fontWeight: 600 }}>{row.label}</td>
                    {selected.map((c) => (
                      <td key={c.id} className="num">{row.fmt(row.get(c))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
