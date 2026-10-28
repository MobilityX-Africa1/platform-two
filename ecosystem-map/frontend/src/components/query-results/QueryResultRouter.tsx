import { CompanyListResult } from './CompanyListResult';
import { InvestmentSummaryResult } from './InvestmentSummaryResult';
import { CountryComparisonResult } from './CountryComparisonResult';
import { SingleMetricResult } from './SingleMetricResult';
import { RawResponseFallback } from './RawResponseFallback';

// Keyed by the "queryType" backend/api/chat.js's RESPONSE_SCHEMA guarantees
// on a successful parse — one fixed renderer per type, so the same shape
// always renders the same way regardless of what the question was.
const RENDERERS = {
  company_list: CompanyListResult,
  investment_summary: InvestmentSummaryResult,
  country_comparison: CountryComparisonResult,
  single_metric: SingleMetricResult,
};

export function QueryResultRouter({ queryType, result, raw, parseError }) {
  const Renderer = queryType ? RENDERERS[queryType] : null;
  if (!Renderer || !result) {
    return <RawResponseFallback raw={raw} parseError={parseError} />;
  }
  return <Renderer result={result} />;
}
