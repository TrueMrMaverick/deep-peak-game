import { createContext, ReactNode, useContext, useMemo } from 'react';
import { GameState, GameStore } from './GameStore';
import { useGameStore } from './useGameStore';

const GameStoreContext = createContext<GameStore | null>(null);

const selectWholeState = (state: GameState) => state;

interface GameStoreProviderProps {
  initialState?: Partial<GameState>;
  children: ReactNode;
}

export function GameStoreProvider({ initialState, children }: GameStoreProviderProps) {
  const store = useMemo(() => new GameStore(initialState), [initialState]);
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
}

export function useGameStoreContext(): GameStore {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error('useGameStoreContext must be used within GameStoreProvider');
  }
  return store;
}

export function useGame(): GameState;
export function useGame<T>(selector: (state: GameState) => T): T;
export function useGame<T>(selector?: (state: GameState) => T): T | GameState {
  const store = useGameStoreContext();
  const resolved = (selector ?? selectWholeState) as (state: GameState) => T;
  return useGameStore(store, resolved);
}
