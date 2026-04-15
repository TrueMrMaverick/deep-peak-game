import { Item, ItemRegistry } from './ItemRegistry';

export interface OrderLine {
  /** Уникальный id строки внутри заказа */
  lineId: string;
  item: Item;
  collected: boolean;
}

export interface Order {
  id: string;
  /** Каждая единица товара — отдельная строка (quantity=2 → 2 строки) */
  lines: OrderLine[];
}

/**
 * Генератор заказов.
 * Случайно выбирает товары из ItemRegistry и формирует заказ.
 */
export class OrderGenerator {
  private registry: ItemRegistry;
  private orderCounter = 0;
  private lineCounter = 0;

  /** @param minItems минимальное кол-во позиций в заказе */
  /** @param maxItems максимальное кол-во позиций в заказе */
  constructor(
    private minItems: number = 2,
    private maxItems: number = 4,
  ) {
    this.registry = ItemRegistry.getInstance();
  }

  generate(): Order {
    const allItems = this.registry.getAllItems();
    // totalLines — итоговое кол-во строк в заказе (minItems..maxItems)
    const totalLines = this.randomInt(this.minItems, this.maxItems);

    // перемешиваем все товары
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);

    const lines: OrderLine[] = [];
    // счётчик сколько раз каждый товар уже добавлен
    const countById = new Map<string, number>();

    let attempts = 0;
    while (lines.length < totalLines && attempts < totalLines * 10) {
      attempts++;
      const item = shuffled[Math.floor(Math.random() * shuffled.length)];
      const current = countById.get(item.id) ?? 0;
      if (current >= 3) continue; // не более 3 одного типа
      countById.set(item.id, current + 1);
      this.lineCounter += 1;
      lines.push({
        lineId: `line-${this.lineCounter}`,
        item,
        collected: false,
      });
    }

    this.orderCounter += 1;

    return {
      id: `order-${this.orderCounter}`,
      lines,
    };
  }

  /**
   * Помечает строку заказа как собранную.
   * Коллега может вызвать этот метод, когда курьер подбирает товар.
   * @returns новый объект Order с обновлённой строкой
   */
  collectItem(order: Order, lineId: string): Order {
    return {
      ...order,
      lines: order.lines.map((line) =>
        line.lineId === lineId ? { ...line, collected: true } : line,
      ),
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
