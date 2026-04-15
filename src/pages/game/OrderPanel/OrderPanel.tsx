import { ItemRegistry } from '../../../game/ItemRegistry';
import { useGame } from '../store';
import './OrderPanel.css';

const registry = ItemRegistry.getInstance();

export function OrderPanel() {
  const order = useGame((s) => s.order);

  return (
    <div className='OrderPanel-root'>
      <div className='OrderPanel-title'>Заказ</div>
      <ul className='OrderPanel-list'>
        {order.map((entry, i) => {
          const item = registry.getItem(entry.itemId);
          return (
            <li
              key={i}
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
