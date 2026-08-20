// Raw-dollar fields only (e.g. allocator "Typical investment size (USD)").
export function formatUSD(amount) {
  if (amount == null) return '—';
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Companies Pipeline and Deal Tracker amounts are stored pre-converted to
// millions (e.g. 618 = $618m) — see CHANGES.md §4/§6. Never divide these.
export function formatUSDM(amountM) {
  if (amountM == null) return '—';
  if (Math.abs(amountM) >= 1000) return `$${(amountM / 1000).toFixed(1)}B`;
  if (Math.abs(amountM) >= 1) return `$${amountM % 1 === 0 ? amountM.toFixed(0) : amountM.toFixed(1)}M`;
  return `$${(amountM * 1000).toFixed(0)}K`;
}

// Precise currency for unit-economics figures (fuel/electricity prices, per-km
// costs) where formatUSD's K/M abbreviation would round away the actual value.
export function formatMoney(amount, decimals = 0) {
  if (amount == null) return '—';
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// Asset Economics rates are stored as whole-number percentages (27.57 = 27.57%).
export function formatPercent(value, decimals = 1) {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString();
}

export function formatDate(dateValue) {
  if (!dateValue?.start) return '—';
  return new Date(dateValue.start).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Month + year only — for "updated Aug 2026"-style captions driven off a
// Notion page's last_edited_time rather than a dedicated date property.
export function formatMonthYear(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Strip the parenthetical ticket-size range Notion carries on the Stage
// option (e.g. "Seed ($1m–$5m)" -> "Seed") — display only, never stored.
export function displayStage(stage) {
  if (!stage) return null;
  return stage.split(' (')[0];
}

// Import duty status drives the policy chip's colour everywhere it appears —
// waived reads positive (leaf), reduced is a partial win (sky), anything else
// (standard/unset) is neutral so an unrecognised Notion value never renders unstyled.
export function policyChipClass(status) {
  if (!status) return 'chip-neutral';
  const s = status.toLowerCase();
  if (s.includes('waiv')) return 'chip-upstream';
  if (s.includes('reduc')) return 'chip-downstream';
  return 'chip-neutral';
}

// EV Asset Tags fall into the 3 categories from the universal taxonomy
// (guidance doc §5) — colour-code by category so the badge row reads at a
// glance instead of every tag looking the same.
const ELECTRIC_ASSET_TAGS = new Set([
  'Electric motorbike (E2W)', 'Electric trike/tuk-tuk (E3W)', 'e-bikes (cargo)',
  'Car (EV)', 'Electric Bus', 'Electric Minibus', 'Electric Van/truck',
]);
const BATTERY_SWAP_TAGS = new Set(['2&3W Battery', 'Swap Station', 'Swap box']);

export function evAssetTagClass(tag) {
  if (ELECTRIC_ASSET_TAGS.has(tag)) return 'chip-upstream';
  if (BATTERY_SWAP_TAGS.has(tag)) return 'chip-cross-ecosystem';
  return 'chip-downstream'; // infrastructure: Charging Stations / Charging units
}

// Deterministic color per free-text category (vertical, investor type, deal
// type, ...) — same label always lands on the same one of the app's 4 chip
// colors, so long list pages (Companies, Allocators) read at a glance by
// category instead of every row's tag being the same flat neutral chip.
const CATEGORY_CHIP_CLASSES = ['chip-neutral', 'chip-upstream', 'chip-downstream', 'chip-cross-ecosystem'];

export function categoryChipClass(label) {
  if (!label) return 'chip-neutral';
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return CATEGORY_CHIP_CLASSES[Math.abs(hash) % CATEGORY_CHIP_CLASSES.length];
}

// Lightweight sentiment read on short status-style field values ("Active",
// "Improving", "Moderate", ...) — lets a plain qualitative value render as a
// colored chip instead of bold plain text, which is what turned country/
// market detail pages into a wall of identical label/value rows. Neutral
// (not a false positive/negative guess) for anything that isn't clearly one
// or the other, including spec-like strings ("Type 2 (EU standard)...").
const POSITIVE_STATUS = /\b(active|improving|strong|high|waived|available|good|excellent|growing)\b/i;
const NEGATIVE_STATUS = /\b(inactive|declining|weak|low|poor|none|unavailable|banned|absent)\b/i;

export function statusChipClass(value) {
  if (!value) return 'chip-neutral';
  if (POSITIVE_STATUS.test(value)) return 'chip-upstream';
  if (NEGATIVE_STATUS.test(value)) return 'chip-cross-ecosystem';
  return 'chip-neutral';
}
