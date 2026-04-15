import { PRODUCT_IMAGE_BY_ID } from './productImages';

export interface Item {
  id: string;
  name: string;
  imageUrl?: string;
}

const CATALOG: Item[] = [
  { id: 'banana', name: 'Банан', imageUrl: PRODUCT_IMAGE_BY_ID.banana },
  { id: 'apple', name: 'Яблоко', imageUrl: PRODUCT_IMAGE_BY_ID.apple },
  { id: 'carrot', name: 'Морковь', imageUrl: PRODUCT_IMAGE_BY_ID.carrot },
  { id: 'onion', name: 'Лук', imageUrl: PRODUCT_IMAGE_BY_ID.onion },
  { id: 'potato', name: 'Картофель', imageUrl: PRODUCT_IMAGE_BY_ID.potato },
  { id: 'fish', name: 'Рыба', imageUrl: PRODUCT_IMAGE_BY_ID.fish },
  { id: 'rice', name: 'Рис', imageUrl: PRODUCT_IMAGE_BY_ID.rice },
  { id: 'pasta-spaghetti', name: 'Спагетти', imageUrl: PRODUCT_IMAGE_BY_ID['pasta-spaghetti'] },
  { id: 'pasta-farfalle', name: 'Паста фарфалле', imageUrl: PRODUCT_IMAGE_BY_ID['pasta-farfalle'] },
  { id: 'pasta-pack', name: 'Макароны', imageUrl: PRODUCT_IMAGE_BY_ID['pasta-pack'] },
  { id: 'bread', name: 'Хлеб', imageUrl: PRODUCT_IMAGE_BY_ID.bread },
  { id: 'butter', name: 'Масло', imageUrl: PRODUCT_IMAGE_BY_ID.butter },
  { id: 'cheese', name: 'Сыр', imageUrl: PRODUCT_IMAGE_BY_ID.cheese },
  { id: 'chicken', name: 'Курица', imageUrl: PRODUCT_IMAGE_BY_ID.chicken },
  { id: 'eggs', name: 'Яйца', imageUrl: PRODUCT_IMAGE_BY_ID.eggs },
  { id: 'icecream', name: 'Мороженое', imageUrl: PRODUCT_IMAGE_BY_ID.icecream },
  { id: 'milk', name: 'Молоко', imageUrl: PRODUCT_IMAGE_BY_ID.milk },
  { id: 'pineapple', name: 'Ананас', imageUrl: PRODUCT_IMAGE_BY_ID.pineapple },
  { id: 'sausage', name: 'Колбаса', imageUrl: PRODUCT_IMAGE_BY_ID.sausage },
  { id: 'yogurt', name: 'Йогурт', imageUrl: PRODUCT_IMAGE_BY_ID.yogurt },
];

/**
 * Глобальное хранилище товаров и путей к картинкам из `pages/game/images`.
 */
export class ItemRegistry {
  private static instance: ItemRegistry;

  private items: Map<string, Item> = new Map(CATALOG.map((item) => [item.id, item]));

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

  getRandomItem(): Item {
    const all = this.getAllItems();
    return all[Math.floor(Math.random() * all.length)] ?? all[0];
  }

  /** Регистрация нового товара (для использования коллегой при добавлении картинок) */
  registerItem(item: Item): void {
    this.items.set(item.id, item);
  }
}
