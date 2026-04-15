import { useCallback, useEffect } from 'react';
import './GamePage.css';
import bg from './storage.jpg';
import courierDown from './images/courier-down.svg';
import courierUp from './images/courier-up.svg';
import { GameStoreProvider, useGame, useGameStoreContext } from './store';
import { Shelves } from './components/Shelves';
import { OrderPanel } from './OrderPanel';

function GameContent() {
  const store = useGameStoreContext();
  const courierArmsUp = useGame((s) => s.courierArmsUp);
  const courierMirrored = useGame((s) => s.courierMirrored);

  useEffect(() => {
    store.startLoop();
    return () => store.stopLoop();
  }, [store]);

  const onArrowUp = useCallback(() => {
    store.update({ courierArmsUp: false });
  }, [store]);

  const onArrowDown = useCallback(() => {
    store.update({ courierArmsUp: true });
  }, [store]);

  /** Влево — без отражения, вправо — зеркально */
  const onArrowLeft = useCallback(() => {
    store.update({ courierMirrored: false });
  }, [store]);

  const onArrowRight = useCallback(() => {
    store.update({ courierMirrored: true });
  }, [store]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onArrowLeft();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onArrowRight();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

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
