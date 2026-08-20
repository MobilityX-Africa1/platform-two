import { useParams, Link } from 'react-router-dom';
import { useNotionData } from '../hooks/useNotionData';
import { CardSkeletonGrid } from '../components/Skeletons';
import { CountryFlag } from '../components/CountryFlag';
import { Breadcrumb } from '../components/Breadcrumb';
import { getField } from '../lib/normalize';
import { formatMoney, formatMonthYear, formatNumber } from '../lib/format';
import {
  annualIce, annualEv, annualDelta, annualDeltaPct, threeYearDelta,
  iceYearTco, evYearTco, annualEvFinancingCost, impliedAnnualDistanceKm,
} from '../lib/assetEconomics';

const money = (v) => formatMoney(v);
const money2 = (v) => formatMoney(v, 2);
const dash = '—';
const diff = (a, b) => (a == null || b == null ? null : a - b);

function StatTile({ label, value, accent }) {
  return (
    <div className="econ-stat-tile">
      <span className="econ-stat-label">{label}</span>
      <span className={`econ-stat-value${accent ? ' accent' : ''}`}>{value}</span>
    </div>
  );
}

function PlainRow({ label, value }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="econ-num-cell">{value}</td>
    </tr>
  );
}

function CompareRow({ label, ice, ev, delta, bold }) {
  return (
    <tr className={bold ? 'econ-total' : undefined}>
      <td>{label}</td>
      <td className="econ-num-cell">{ice}</td>
      <td className="econ-num-cell">{ev}</td>
      <td className="econ-num-cell econ-delta-cell">{delta}</td>
    </tr>
  );
}

function Section({ title, twoCol, children }) {
  return (
    <div>
      <h3 className="econ-section-title">{title}</h3>
      <table className="econ-section-table">
        {!twoCol && (
          <thead>
            <tr>
              <th />
              <th>ICE</th>
              <th>EV</th>
              <th>Δ</th>
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AssetEconomicsMarketPage() {
  const { id } = useParams();
  const { economics, status } = useNotionData();

  if (status !== 'ready') return <CardSkeletonGrid count={4} />;

  const econ = economics.find((e) => e.id === id);
  if (!econ) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <p>Market not found.</p>
        <Breadcrumb to="/asset-economics" label="All markets" />
      </div>
    );
  }

  const iceAnnual = annualIce(econ);
  const evAnnual = annualEv(econ);
  const delta = annualDelta(econ);
  const deltaPct = annualDeltaPct(econ);
  const threeYr = threeYearDelta(econ);

  const icePurchase = getField(econ, 'ICE Bike Price USD');
  const evPurchase = getField(econ, 'EV Bike Purchase Price Excl Battery USD');
  const purchaseDelta = icePurchase != null && evPurchase != null ? evPurchase - icePurchase : null;
  const financingTermMonths = getField(econ, 'Refinancing Period Months');
  const evAnnualFinancing = annualEvFinancingCost(econ);

  const distanceKm = impliedAnnualDistanceKm(econ);

  return (
    <div className="econ-scope stack" style={{ gap: 24 }}>
      <div>
        <Breadcrumb to="/asset-economics" label="All markets" />
      </div>

      <div>
        <span className="eyebrow">Unit economics — full breakdown</span>
        <h1 className="row" style={{ marginTop: 4, gap: 12 }}>
          <CountryFlag name={econ.name} size={28} />
          {econ.name}
        </h1>
        <p className="econ-meta" style={{ marginTop: 6 }}>
          2-wheeler, annual basis
          {econ.lastEditedTime && ` · updated ${formatMonthYear(econ.lastEditedTime)}`}
          {econ.source && ` · source: ${econ.source}`}
          {econ.country && (
            <>
              {' · '}
              <Link to={`/country/${econ.country.id}`} style={{ fontWeight: 600, color: 'var(--econ-accent)' }}>
                Country profile
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="econ-stat-tiles">
        <StatTile label="ICE / yr" value={money(iceAnnual)} />
        <StatTile label="EV / yr" value={money(evAnnual)} accent />
        <StatTile label="Δ annual" value={money(delta)} />
        <StatTile label="Δ %" value={deltaPct == null ? dash : `${Math.round(deltaPct)}%`} accent />
        <StatTile label="3-yr Δ" value={money(threeYr)} />
      </div>

      <Section title="Fuel & electricity prices" twoCol>
        <PlainRow label="Petrol price, per liter" value={money2(getField(econ, 'Fuel Price USD/L'))} />
        <PlainRow label="Electricity price, per kWh" value={money2(getField(econ, 'Electricity Price USD/kWh'))} />
        <PlainRow
          label="Annual distance assumption"
          value={distanceKm == null ? dash : `${formatNumber(distanceKm)} km`}
        />
      </Section>

      <Section title="Vehicle purchase & financing">
        <CompareRow label="Purchase price" ice={money(icePurchase)} ev={money(evPurchase)} delta={money(purchaseDelta)} />
        <CompareRow
          label="Financing term"
          ice={dash}
          ev={financingTermMonths == null ? dash : `${formatNumber(financingTermMonths)} mo`}
          delta={dash}
        />
        <CompareRow label="Annual financing cost" ice={dash} ev={money(evAnnualFinancing)} delta={dash} />
      </Section>

      <Section title="ICE running costs (annual)">
        <CompareRow label="Fuel" ice={money(getField(econ, 'Annual Fuel Cost ICE USD'))} ev={dash} delta={dash} />
        <CompareRow label="Maintenance" ice={money(getField(econ, 'Annual Maintenance ICE USD'))} ev={dash} delta={dash} />
        <CompareRow label="Insurance" ice={money(getField(econ, 'Annual Insurance ICE USD'))} ev={dash} delta={dash} />
        <CompareRow label="Total ICE opex" ice={money(iceAnnual)} ev={dash} delta={dash} bold />
      </Section>

      <Section title="EV running costs (annual)">
        <CompareRow label="Electricity" ice={dash} ev={money(getField(econ, 'Annual Electricity Cost USD'))} delta={dash} />
        <CompareRow label="Maintenance" ice={dash} ev={money(getField(econ, 'Annual Maintenance EV USD'))} delta={dash} />
        <CompareRow label="Insurance" ice={dash} ev={money(getField(econ, 'Annual Insurance EV USD'))} delta={dash} />
        <CompareRow label="Total EV opex" ice={dash} ev={money(evAnnual)} delta={dash} bold />
      </Section>

      <Section title="Total cost of ownership">
        <CompareRow
          label="Year 1 (cumulative)"
          ice={money(iceYearTco(econ, 1))}
          ev={money(evYearTco(econ, 1))}
          delta={money(diff(iceYearTco(econ, 1), evYearTco(econ, 1)))}
        />
        <CompareRow
          label="Year 2 (cumulative)"
          ice={money(iceYearTco(econ, 2))}
          ev={money(evYearTco(econ, 2))}
          delta={money(diff(iceYearTco(econ, 2), evYearTco(econ, 2)))}
        />
        <CompareRow
          label="Year 3 (cumulative)"
          ice={money(iceYearTco(econ, 3))}
          ev={money(evYearTco(econ, 3))}
          delta={money(threeYr)}
          bold
        />
      </Section>
    </div>
  );
}
