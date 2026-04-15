import { useGame } from '../store';
import './GameOverScreen.css';

export function GameOverScreen() {
  const score = useGame((s) => s.score);
  const ordersCompleted = useGame((s) => s.ordersCompleted);

  return (
    <div className='GameOverScreen-overlay'>
      <div className='GameOverScreen-card'>
        <div className='GameOverScreen-icon'>📦</div>
        <h2 className='GameOverScreen-title'>Время вышло!</h2>
        <p className='GameOverScreen-description'>Вы не приняты на работу в Лавку!</p>
        <div className='GameOverScreen-stats'>
          <div className='GameOverScreen-stat'>
            <span className='GameOverScreen-stat-label'>Заказов собрано</span>
            <span className='GameOverScreen-stat-value'>{ordersCompleted}</span>
          </div>
          <div className='GameOverScreen-stat'>
            <span className='GameOverScreen-stat-label'>Очки</span>
            <span className='GameOverScreen-stat-value'>{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
