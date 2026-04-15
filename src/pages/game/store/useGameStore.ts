import { useRef, useSyncExternalStore } from 'react';
import { GameState, GameStore } from './GameStore';

export function useGameStore(store: GameStore): GameState;
export function useGameStore<T>(store: GameStore, selector: (state: GameState) => T): T;
export function useGameStore<T>(
  store: GameStore,
  selector?: (state: GameState) => T,
): T | GameState {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => {
      const state = store.getState();
      return selectorRef.current ? selectorRef.current(state) : state;
    },
  );
}
