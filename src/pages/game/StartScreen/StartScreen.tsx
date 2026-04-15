import logo from '../images/logo.webp';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className='StartScreen-overlay'>
      <div className='StartScreen-card'>
        <img src={logo} alt='Логотип' className='StartScreen-logo' />
        <h1 className='StartScreen-title'>Собеседование на складе</h1>
        <p className='StartScreen-description'>
          Товары едут по полкам — лови нужные для заказа!<br />
          Управляй руками курьера стрелками или WASD.<br />
          Успей собрать заказ до истечения времени.
        </p>
        <button className='StartScreen-button' onClick={onStart}>
          Начать!
        </button>
        <span className='StartScreen-brand'>Deep Peak Production</span>
      </div>
    </div>
  );
}
