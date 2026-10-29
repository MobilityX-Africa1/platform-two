import { CompanyListResult } from './CompanyListResult';
import { InvestmentSummaryResult } from './InvestmentSummaryResult';
import { CountryComparisonResult } from './CountryComparisonResult';
import { SingleMetricResult } from './SingleMetricResult';
import { RawResponseFallback } from './RawResponseFallback';
import type { QueryResult } from '../../types/query';

interface Props {
  result: QueryResult | null;
  raw: string;
  parseError: string | null;
}

// One fixed renderer per queryType (see types/query.ts), so the same shape
// always renders the same way regardless of what the question was. `result`
// has already been shape-checked by parseQueryResult(), so it's null rather
// than malformed when the model's answer can't be rendered.
export function QueryResultRouter({ result, raw, parseError }: Props) {
  if (!result) return <RawResponseFallback raw={raw} parseError={parseError} />;

  switch (result.queryType) {
    case 'company_list':
      return <CompanyListResult result={result} />;
    case 'investment_summary':
      return <InvestmentSummaryResult result={result} />;
    case 'country_comparison':
      return <CountryComparisonResult result={result} />;
    case 'single_metric':
      return <SingleMetricResult result={result} />;
    default: {
      // Adding a queryType without a renderer is a compile error here.
      const unhandled: never = result;
      return unhandled;
    }
  }
}
