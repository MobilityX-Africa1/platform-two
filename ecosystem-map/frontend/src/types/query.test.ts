import { describe, expect, it } from 'vitest';
import { parseQueryResult } from './query';

const companyList = {
  queryType: 'company_list',
  summary: '2 companies found in Kenya',
  totalCount: 2,
  groups: [{ label: 'Ranked', companies: [{ name: 'BasiGo', id: 'abc' }, { name: 'Roam', id: '' }] }],
  caveats: ['1 company has no Location set'],
};

describe('parseQueryResult', () => {
  it('accepts a well-formed answer', () => {
    expect(parseQueryResult(companyList)).toEqual(companyList);
  });

  it('rejects answers a renderer would crash on', () => {
    expect(parseQueryResult({ ...companyList, groups: undefined })).toBeNull();
    expect(parseQueryResult({ ...companyList, groups: [{ label: 'Ranked' }] })).toBeNull();
    expect(
      parseQueryResult({ queryType: 'investment_summary', summary: 's', byYear: [] }),
    ).toBeNull();
  });

  it('rejects unknown query types and non-objects', () => {
    expect(parseQueryResult({ ...companyList, queryType: 'pie_chart' })).toBeNull();
    expect(parseQueryResult(null)).toBeNull();
    expect(parseQueryResult('{"queryType":"company_list"}')).toBeNull();
  });

  it('fills in a missing caveats list rather than rejecting the answer', () => {
    expect(parseQueryResult({ ...companyList, caveats: undefined })?.caveats).toEqual([]);
  });
});
