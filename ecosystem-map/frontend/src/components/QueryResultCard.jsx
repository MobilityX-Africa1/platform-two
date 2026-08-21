import { ArrowLeft } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';
import { QueryResultRouter } from './query-results/QueryResultRouter';
import { ListSkeleton } from './Skeletons';

// Renders wherever a query is active — see Layout.jsx, which places this
// directly above <Outlet/> so it reads as the same "detail page sits above
// the list it came from" pattern every other page in the app uses, not a
// bolted-on card. The "New query" control reuses .breadcrumb-link verbatim
// (same sticky pill CountryPage/CompanyPage/etc. use to go back) so leaving
// a result set behaves identically to leaving any other detail view; see
// BackButton.jsx, which hides itself while this is showing so the two
// sticky pills never stack.
export function QueryResultCard() {
  const { result, loading, clear } = useQuery();
  if (!result && !loading) return null;

  return (
    <div className="stack" style={{ gap: 24, marginBottom: 32 }}>
      <button type="button" className="breadcrumb-link" onClick={clear}>
        <ArrowLeft size={15} strokeWidth={2.25} />
        New query
      </button>

      <div className="page-header">
        <span className="eyebrow">Ask EcoMap</span>
        <h1>{loading ? 'Thinking…' : result.title}</h1>
      </div>

      {loading && <ListSkeleton count={4} />}

      {!loading && result.type === 'answer' && (
        <QueryResultRouter
          queryType={result.payload.queryType}
          result={result.payload.result}
          raw={result.payload.raw}
          parseError={result.payload.parseError}
        />
      )}

      {!loading && result.type === 'error' && (
        <p style={{ color: 'var(--coral-dark)' }}>Couldn't get an answer: {result.payload.message}</p>
      )}
    </div>
  );
}
