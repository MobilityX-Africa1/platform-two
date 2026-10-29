import type { Economics } from '../types/records';

// Single sequential violet ramp shared by the market comparison table (bar +
// Δ% shading) and the existing per-market savings chart on this page —
// magnitude drives shade, not category, so there is only ever one hue here.
const RAMP_LOW = [0xe4, 0xe0, 0xf6]; // #e4e0f6
const RAMP_HIGH = [0x33, 0x27, 0x72]; // #332772
export function violetShade(t: number | null | undefined): string {
  const clamped = Math.max(0, Math.min(1, t || 0));
  const [r, g, b] = RAMP_LOW.map((c, i) => Math.round(c + (RAMP_HIGH[i]! - c) * clamped));
  return `rgb(${r}, ${g}, ${b})`;
}

// Same ramp, floored — for coloring the *number itself* (not a bar) on
// wide-range lists like Companies-by-funding, where most rows cluster near
// the low end and would otherwise render in the ramp's near-white low tail,
// effectively invisible against a light card. Bars can still use the raw
// ramp (a faint bar for a small value is a legible signal); text can't.
// Floor picked so the lightest allowed text shade is never lighter than the
// app's own text-color floor (--muted / --econ-ink-2, #52514e) — no text
// anywhere should read lighter than that reference gray.
const TEXT_SHADE_FLOOR = 0.85;
export function violetTextShade(t: number | null | undefined): string {
  return violetShade(Math.max(t || 0, TEXT_SHADE_FLOOR));
}

// ICE bikes in this dataset are bought outright (no ICE-side loan fields
// exist in Notion), so 'Total Yearly Opex ICE/EV USD' are already the full
// annual cost per side — confirmed against real data: their difference
// matches 'Annual Savings EV vs ICE USD' to rounding, so no re-derivation
// is needed for the headline annual figures.
export function annualIce(econ: Economics): number | null {
  return econ.totalYearlyOpexICEUSD;
}
export function annualEv(econ: Economics): number | null {
  return econ.totalYearlyOpexEVUSD;
}
export function annualDelta(econ: Economics): number | null {
  return econ.annualSavingsEVVsICEUSD;
}
export function annualDeltaPct(econ: Economics): number | null {
  const ice = annualIce(econ);
  const delta = annualDelta(econ);
  if (!ice || delta == null) return null;
  return (delta / ice) * 100;
}

// Notion tracks ICE TCO for years 1–3 only.
export type TcoYear = 1 | 2 | 3;

export function iceYearTco(econ: Economics, year: TcoYear): number | null {
  return econ[`year${year}TCOICEUSD`];
}

// Notion only tracks EV TCO "over the financing period", not per calendar
// year like it does for ICE — so Year-N EV TCO is rebuilt here from the same
// deposit/financing/opex fields Notion uses, spreading the total financing
// cost evenly across the loan term and stopping once it's paid off. This
// reproduces 'Total TCO Over Financing Period USD' exactly for markets whose
// financing term lands on a whole number of years.
export function evYearTco(econ: Economics, year: number): number {
  const deposit = econ.depositUSD ?? 0;
  const totalFinancing = econ.totalEVLoanFinancingCostUSD ?? 0;
  const termMonths = econ.refinancingPeriodMonths;
  const opex = annualEv(econ) ?? 0;
  const financedFraction = termMonths ? Math.min((year * 12) / termMonths, 1) : 0;
  return deposit + financedFraction * totalFinancing + year * opex;
}

export function threeYearDelta(econ: Economics): number | null {
  const ice = iceYearTco(econ, 3);
  if (ice == null) return null;
  return ice - evYearTco(econ, 3);
}

export function annualEvFinancingCost(econ: Economics): number | null {
  const monthly = econ.monthlyLoanRefinancingCostUSD;
  return monthly == null ? null : monthly * 12;
}

// No explicit annual-distance field exists in Notion — implied from ICE fuel
// spend / price / consumption rate (cross-checked to land within rounding of
// the same implied figure computed from the EV side for a given market).
export function impliedAnnualDistanceKm(econ: Economics): number | null {
  const fuelCost = econ.annualFuelCostICEUSD;
  const fuelPrice = econ.fuelPriceUSDL;
  const litresPer100 = econ.litresPer100km;
  if (!fuelCost || !fuelPrice || !litresPer100) return null;
  const litresPerYear = fuelCost / fuelPrice;
  return Math.round((litresPerYear / litresPer100) * 100);
}
