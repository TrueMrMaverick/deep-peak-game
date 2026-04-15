export interface Item {
  id: string;
  name: string;
  imageUrl?: string; // будет заполнено коллегой в отдельном PR
}

/**
 * Глобальное хранилище товаров.
 * Картинки (imageUrl) будут добавлены коллегой в отдельном PR.
 */
export class ItemRegistry {
  private static instance: ItemRegistry;

  private items: Map<string, Item> = new Map([
    ['banana', { id: 'banana', name: 'Банан' }],
    ['soup',   { id: 'soup',   name: 'Суп-лапша' }],
    ['cola',   { id: 'cola',   name: 'Кока-кола' }],
    ['milk',   { id: 'milk',   name: 'Молоко' }],
    ['bread',  { id: 'bread',  name: 'Хлеб' }],
    ['apple',  { id: 'apple',  name: 'Яблоко' }],
    ['water',  { id: 'water',  name: 'Вода' }],
    ['chips',  { id: 'chips',  name: 'Чипсы' }],
  ]);

  static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) {
      ItemRegistry.instance = new ItemRegistry();
    }
    return ItemRegistry.instance;
  }

  getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /** Регистрация нового товара (для использования коллегой при добавлении картинок) */
  registerItem(item: Item): void {
    this.items.set(item.id, item);
  }
}
