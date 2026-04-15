import { useEffect } from 'react';
import './GamePage.css';
import bg from './storage.jpg';
import courierDown from './images/courier-down.svg';
import courierUp from './images/courier-up.svg';
import { GameStoreProvider, useGame, useGameStoreContext, ShelfZone } from './store';
import { Shelves } from './components/Shelves';
import { OrderPanel } from './OrderPanel';

const KEY_TO_ACTION: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up', W: 'up',
  s: 'down', S: 'down',
  a: 'left', A: 'left',
  d: 'right', D: 'right',
  // русская раскладка
  ц: 'up', Ц: 'up',
  ы: 'down', Ы: 'down',
  ф: 'left', Ф: 'left',
  в: 'right', В: 'right',
};

function deriveZone(armsUp: boolean, mirrored: boolean): ShelfZone {
  if (armsUp && !mirrored) return 'top-right';
  if (armsUp && mirrored) return 'top-left';
  if (!armsUp && !mirrored) return 'bottom-right';
  return 'bottom-left';
}

function GameContent() {
  const store = useGameStoreContext();
  const courierArmsUp = useGame((s) => s.courierArmsUp);
  const courierMirrored = useGame((s) => s.courierMirrored);

  useEffect(() => {
    store.startLoop();
    return () => store.stopLoop();
  }, [store]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = KEY_TO_ACTION[e.key];
      if (!action) return;
      e.preventDefault();

      const { courierArmsUp: arms, courierMirrored: mirror } = store.getState();
      let newArms = arms;
      let newMirror = mirror;

      switch (action) {
        case 'up':    newArms = true; break;
        case 'down':  newArms = false; break;
        case 'left':  newMirror = true; break;
        case 'right': newMirror = false; break;
      }

      store.update({
        courierArmsUp: newArms,
        courierMirrored: newMirror,
        playerZone: deriveZone(newArms, newMirror),
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);

  const courierSrc = courierArmsUp ? courierUp : courierDown;
  const courierTransform = `scaleX(${courierMirrored ? -1 : 1})`;

  const score = useGame((s) => s.score);

  return (
    <div className='GamePage-root'>
      <img src={bg} alt='' className='GamePage-bg' />
      <Shelves />
      <div className='GamePage-score'>{score}</div>
      <OrderPanel />
      <div className='GamePage-courierLayer'>
        <img
          src={courierSrc}
          alt='Курьер'
          className='GamePage-courier'
          style={{ transform: courierTransform }}
        />
      </div>
    </div>
  );
}

export function GamePage() {
  return (
    <GameStoreProvider>
      <GameContent />
    </GameStoreProvider>
  );
}
