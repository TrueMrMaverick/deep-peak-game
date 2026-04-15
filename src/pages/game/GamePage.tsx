import { useEffect } from 'react';
import './GamePage.css';
import bg from './storage.jpg';
import { GameStoreProvider, useGameStoreContext } from './store';
import { Shelves } from './components/Shelves';

function GameContent() {
  const store = useGameStoreContext();

  useEffect(() => {
    store.startLoop();
    return () => store.stopLoop();
  }, [store]);

  return (
    <div className='GamePage-root'>
      <img src={bg} alt='bg' className='GamePage-bg'/>
      <Shelves />
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
