import { useEffect } from 'react';
import { ShelfZone, useGame, useGameStoreContext } from '../store';
import { ShelfLane } from './ShelfLane';
import './Shelves.css';

const ZONES: ShelfZone[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

const ZONE_MOVES: Record<string, Partial<Record<ShelfZone, ShelfZone>>> = {
  up: {
    'bottom-left': 'top-left',
    'bottom-right': 'top-right',
  },
  down: {
    'top-left': 'bottom-left',
    'top-right': 'bottom-right',
  },
  left: {
    'top-right': 'top-left',
    'bottom-right': 'bottom-left',
  },
  right: {
    'top-left': 'top-right',
    'bottom-left': 'bottom-right',
  },
};

const KEY_TO_DIRECTION: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

export function Shelves() {
  const store = useGameStoreContext();
  const playerZone = useGame((s) => s.playerZone);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;

      const current = store.getState().playerZone;
      const next = ZONE_MOVES[direction][current];
      if (next) {
        store.update({ playerZone: next });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [store]);

  return (
    <div className="Shelves-root">
      {ZONES.map((zone) => (
        <div
          key={zone}
          className={`Shelves-zone Shelves-zone--${zone}${
            playerZone === zone ? ' Shelves-zone--active' : ''
          }`}
        >
          <ShelfLane zone={zone} />
        </div>
      ))}
    </div>
  );
}
