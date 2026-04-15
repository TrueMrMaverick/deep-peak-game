import { useEffect } from 'react';
import { ShelfZone, useGame, useGameStoreContext } from '../store';
import { ShelfLane } from './ShelfLane';
import './Shelves.css';

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

function zoneClass(zone: ShelfZone, active: ShelfZone) {
  return `Shelves-zone Shelves-zone--${zone}${active === zone ? ' Shelves-zone--active' : ''}`;
}

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
      <div className={zoneClass('top-left', playerZone)}>
        <ShelfLane
          zone="top-left"
          to={{ x: 60, y: 80, scale: 1 }}
          from={{ x: 10, y: 70, scale: 5 }}
        />
      </div>
      <div className={zoneClass('top-right', playerZone)}>
        <ShelfLane
          zone="top-right"
          from={{ x: 90, y: 70, scale: 5 }}
          to={{ x: 20, y: 80, scale: 1 }}
        />
      </div>
      <div className={zoneClass('bottom-left', playerZone)}>
        <ShelfLane
          zone="bottom-left"
          from={{ x: 10, y: 90, scale: 5 }}
          to={{ x: 65, y: 25, scale: 1 }}
        />
      </div>
      <div className={zoneClass('bottom-right', playerZone)}>
        <ShelfLane
          zone="bottom-right"
          from={{ x: 90, y: 90, scale: 5 }}
          to={{ x: 35, y: 25, scale: 1 }}
        />
      </div>
    </div>
  );
}
