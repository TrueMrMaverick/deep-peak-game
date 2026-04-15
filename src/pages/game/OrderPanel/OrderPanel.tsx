import { Order } from '../../../game/OrderGenerator';
import './OrderPanel.css';

interface OrderPanelProps {
  order: Order;
}

export function OrderPanel({ order }: OrderPanelProps) {
  return (
    <div className='OrderPanel-root'>
      <div className='OrderPanel-title'>Заказ #{order.id.replace('order-', '')}</div>
      <ul className='OrderPanel-list'>
        {order.lines.map(({ lineId, item, collected }) => (
          <li
            key={lineId}
            className={`OrderPanel-item${collected ? ' OrderPanel-item--collected' : ''}`}
          >
            <div className='OrderPanel-item-img-wrap'>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className='OrderPanel-item-img' />
              ) : (
                <div className='OrderPanel-item-img-placeholder' />
              )}
            </div>
            <span className='OrderPanel-item-name'>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
