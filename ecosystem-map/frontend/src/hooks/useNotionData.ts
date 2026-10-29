import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';

export function useNotionData() {
  const store = useDataStore();

  // Many components mount with this hook in the same commit, and all of them
  // rendered while status was 'idle'. Read the live status rather than the
  // render-time one, or each would start its own full fetch.
  useEffect(() => {
    if (useDataStore.getState().status === 'idle') {
      useDataStore.getState().fetchAll();
    }
  }, [store.status]);

  return store;
}
