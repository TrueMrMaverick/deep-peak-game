import { useEffect } from 'react';
import { TickCallback } from './GameStore';
import { useGameStoreContext } from './GameStoreContext';

export function useGameLoop(callback: TickCallback): void {
  const store = useGameStoreContext();

  useEffect(() => {
    const unsubscribe = store.addTickCallback(callback);
    return unsubscribe;
  }, [store, callback]);
}
