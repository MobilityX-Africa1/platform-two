import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';

export function useNotionData() {
  const store = useDataStore();

  useEffect(() => {
    if (store.status === 'idle') {
      useDataStore.getState().fetchAll();
    }
  }, [store.status]);

  return store;
}
