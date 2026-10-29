import { describe, expect, it } from 'vitest';
import { getField, normalizePage, toCamel } from './normalize';
import type { NotionPage, NotionProperty } from './normalize';

const text = (value: string): NotionProperty => ({ type: 'rich_text', rich_text: [{ plain_text: value }] });

describe('normalizePage', () => {
  const page: NotionPage = {
    id: 'p1',
    last_edited_time: '2026-09-01T00:00:00.000Z',
    properties: {
      'Organisation name': { type: 'title', title: [{ plain_text: 'Acumen' }] },
      'Type of investor': { type: 'select', select: { name: 'VC' } },
      'Focus Areas': { type: 'multi_select', multi_select: [{ name: 'EV' }, { name: 'Energy' }] },
      'African markets active': { type: 'relation', relation: [{ id: 'kenya' }] },
      Publish: { type: 'checkbox', checkbox: true },
      'Total Funding Raised ($m)': { type: 'number', number: 12.5 },
    },
  };

  it('flattens Notion properties into camelCased fields', () => {
    const record = normalizePage(page);

    expect(record).toMatchObject({
      id: 'p1',
      name: 'Acumen',
      typeOfInvestor: 'VC',
      focusAreas: ['EV', 'Energy'],
      africanMarketsActive: ['kenya'],
      publish: true,
      totalFundingRaisedM: 12.5,
    });
  });

  it('records which keys are relations so they can be resolved later', () => {
    expect(normalizePage(page)._relationKeys).toEqual(['africanMarketsActive']);
  });

  it('looks fields up by their exact Notion label', () => {
    expect(getField(normalizePage(page), 'Total Funding Raised ($m)')).toBe(12.5);
    expect(toCamel('Annual Savings EV vs ICE USD')).toBe('annualSavingsEVVsICEUSD');
  });
});

describe('placeholder text', () => {
  const summaryOf = (value: string) =>
    normalizePage({ id: 'p', properties: { 'Business summary': text(value) } }).businessSummary;

  it('treats internal mock/placeholder markers as empty, never public copy', () => {
    expect(summaryOf('MOCK — replace before launch')).toBeNull();
    expect(summaryOf('PLACEHOLDER — no data yet')).toBeNull();
    expect(summaryOf('No verified deals tracked — mock placeholder')).toBeNull();
  });

  it('keeps real text that merely contains those letters', () => {
    expect(summaryOf('Mockingbird Motors builds e-bikes')).toBe('Mockingbird Motors builds e-bikes');
  });
});
