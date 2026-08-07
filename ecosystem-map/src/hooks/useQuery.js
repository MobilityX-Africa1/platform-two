import { useQueryStore } from '../store/queryStore';

export function useQuery() {
  const { queryText, result, loading, run, clear } = useQueryStore();

  return { queryText, result, loading, run, clear };
}
