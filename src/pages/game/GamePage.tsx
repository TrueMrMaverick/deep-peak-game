import './GamePage.css';
import bg from './storage.jpg';
import { GameStoreProvider } from './store';

interface GamePageProps {

}

export function GamePage(props: GamePageProps) {

  return (
    <GameStoreProvider>
      <div className='GamePage-root'>
        <img src={bg} alt='bg' className='GamePage-bg'/>
      </div>
    </GameStoreProvider>
  );
}
