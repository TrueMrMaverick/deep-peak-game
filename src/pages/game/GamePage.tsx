import './GamePage.css';
import bg from './storage.jpg';

interface GamePageProps {

}

export function GamePage(props: GamePageProps) {

  return (
  <div className='GamePage-root'>
      <img src={bg} alt='bg' className='GamePage-bg'/>
    </div>
  );
}
