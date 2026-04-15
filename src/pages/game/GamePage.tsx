import { useEffect, useMemo, useState } from 'react';
import './GamePage.css';
import bg from './storage.jpg';
import { GameStoreProvider, useGameStoreContext } from './store';
import { Shelves } from './components/Shelves';
import { OrderPanel } from './OrderPanel';
import { OrderGenerator, Order } from '../../game/OrderGenerator';

function GameContent() {
  const store = useGameStoreContext();

  const generator = useMemo(() => new OrderGenerator(4, 6), []);
  const [order] = useState<Order>(() => generator.generate());

  useEffect(() => {
    store.startLoop();
    return () => store.stopLoop();
  }, [store]);

  return (
    <div className='GamePage-root'>
      <img src={bg} alt='bg' className='GamePage-bg'/>
      <Shelves />
      <OrderPanel order={order} />
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
