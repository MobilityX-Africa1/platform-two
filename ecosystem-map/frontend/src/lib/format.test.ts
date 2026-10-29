import { describe, expect, it } from 'vitest';
import { formatMoney, formatUSD, formatUSDM } from './format';

// Headline funding figures go through these — a unit slip here (millions vs.
// dollars) would misstate every total on the site.

describe('formatUSDM (amounts stored in millions)', () => {
  it('formats millions without dividing them again', () => {
    expect(formatUSDM(618)).toBe('$618M');
    expect(formatUSDM(2.5)).toBe('$2.5M');
  });

  it('rolls up to billions and down to thousands', () => {
    expect(formatUSDM(1500)).toBe('$1.5B');
    expect(formatUSDM(0.25)).toBe('$250K');
  });

  it('shows a dash for missing values', () => {
    expect(formatUSDM(null)).toBe('—');
    expect(formatUSDM(undefined)).toBe('—');
  });
});

describe('formatUSD (raw dollar amounts)', () => {
  it('abbreviates to K and M', () => {
    expect(formatUSD(2_500_000)).toBe('$2.5M');
    expect(formatUSD(50_000)).toBe('$50K');
  });
});

describe('formatMoney', () => {
  it('keeps precision and puts the sign before the currency', () => {
    expect(formatMoney(0.0345, 3)).toBe('$0.035');
    expect(formatMoney(-1200)).toBe('-$1,200');
  });
});
