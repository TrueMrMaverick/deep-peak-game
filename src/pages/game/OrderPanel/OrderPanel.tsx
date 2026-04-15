import { ItemRegistry } from '../../../game/ItemRegistry';
import { useGame } from '../store';
import './OrderPanel.css';

const registry = ItemRegistry.getInstance();

export function OrderPanel() {
  const order = useGame((s) => s.order);
  const orderNumber = useGame((s) => s.orderNumber);
  const orderTimeLeft = useGame((s) => s.orderTimeLeft);

  // Максимум 2 строки — количество колонок = ceil(count / 2)
  const cols = Math.ceil(order.length / 2);

  const timeLeftSec = Math.ceil(orderTimeLeft);
  const isUrgent = timeLeftSec <= 10;

  return (
    <div className='OrderPanel-root'>
      <div className='OrderPanel-header'>
        <div className='OrderPanel-title'>Заказ #{orderNumber}</div>
        <div className={`OrderPanel-timer${isUrgent ? ' OrderPanel-timer--urgent' : ''}`}>
          ⏱ {timeLeftSec}с
        </div>
      </div>
      <ul
        className='OrderPanel-list'
        style={{ gridTemplateColumns: `repeat(${cols}, 140px)` }}
      >
        {order.map((entry, i) => {
          const item = registry.getItem(entry.itemId);
          return (
            <li
              key={`${orderNumber}-${i}-${entry.itemId}`}
              className={`OrderPanel-item${entry.collected ? ' OrderPanel-item--collected' : ''}`}
            >
              <div className='OrderPanel-item-img-wrap'>
                {item?.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className='OrderPanel-item-img' />
                ) : (
                  <div className='OrderPanel-item-img-placeholder' />
                )}
              </div>
              <span className='OrderPanel-item-name'>{item?.name ?? entry.itemId}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
