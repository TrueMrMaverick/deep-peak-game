import { useMemo, useState } from 'react';
import './GamePage.css';
import bg from './storage.jpg';
import { GameStoreProvider } from './store';
import { OrderPanel } from './OrderPanel';
import { OrderGenerator, Order } from '../../game/OrderGenerator';

interface GamePageProps {}

export function GamePage(props: GamePageProps) {
  const generator = useMemo(() => new OrderGenerator(4, 6), []);

  const [order] = useState<Order>(() => generator.generate());

  return (
    <GameStoreProvider>
      <div className='GamePage-root'>
        <img src={bg} alt='bg' className='GamePage-bg' />
        <OrderPanel order={order} />
      </div>
    </GameStoreProvider>
  );
}
