import { ItemRegistry } from '../../../game/ItemRegistry';

export type ShelfZone = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ProductStatus = 'moving' | 'falling';

export interface ProductData {
  id: number;
  /** id товара из `ItemRegistry` (картинка из `pages/game/images`) */
  itemId: string;
  zone: ShelfZone;
  progress: number;
  speed: number;
  status: ProductStatus;
}

export interface OrderItem {
  itemId: string;
  collected: boolean;
}

export interface GameState {
  score: number;
  level: number;
  isRunning: boolean;
  playerZone: ShelfZone;
  products: ProductData[];
  order: OrderItem[];
  /** Номер текущего заказа для UI (после полного сбора +1 и новый заказ). */
  orderNumber: number;
  /** Руки вверх (`courier-up`) или вниз (`courier-down`). */
  courierArmsUp: boolean;
  /** Зеркально по горизонтали: false — оригинал (стрелка вправо), true — отражение (стрелка влево). */
  courierMirrored: boolean;
  /** Оставшееся время на сборку текущего заказа (секунды). */
  orderTimeLeft: number;
  /** Игра завершена (время вышло). */
  gameOver: boolean;
  /** Количество успешно собранных заказов. */
  ordersCompleted: number;
}

export interface FrameInfo {
  delta: number;
  elapsed: number;
  timestamp: number;
}

export type TickCallback = (frame: FrameInfo, store: GameStore) => void;

export type GameEventType = 'falling' | 'caught';

export interface GameEvent {
  type: GameEventType;
  product: ProductData;
  inOrder?: boolean;
}

export type GameEventListener = (event: GameEvent) => void;

type Listener = () => void;

const ORDER_TIME_LIMIT = 45; // секунд на сборку одного заказа

const INITIAL_STATE: GameState = {
  score: 0,
  level: 1,
  isRunning: false,
  playerZone: 'top-left',
  products: [],
  order: [],
  orderNumber: 1,
  courierArmsUp: true,
  courierMirrored: false,
  orderTimeLeft: ORDER_TIME_LIMIT,
  gameOver: false,
  ordersCompleted: 0,
};

const CATCH_THRESHOLD = 0.9;
const SCORE_HIT = 100;
const SCORE_MISS = -100;
const SCORE_ORDER_COMPLETE = 500;
/** Сколько позиций в одном заказе: все разные, каждый раз новый случайный набор из каталога. */
const ORDER_SIZE = 5;

const SPAWN_INTERVAL = 1.5;
const PRODUCT_SPEED = 0.35;
const ZONES: ShelfZone[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

let nextProductId = 0;

const itemRegistry = ItemRegistry.getInstance();

export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();
  private eventListeners = new Map<GameEventType, Set<GameEventListener>>();

  private tickCallbacks = new Set<TickCallback>();
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private elapsedTime: number = 0;
  private _running = false;
  private spawnTimer: number = SPAWN_INTERVAL;
  private spawnsSinceOrder: number = 0;
  private nextOrderSpawn: number = this.randomInt(2, 5);

  constructor(initialState: Partial<GameState> = {}) {
    this.state = { ...INITIAL_STATE, ...initialState };
  }

  getState(): GameState {
    return this.state;
  }

  update(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  addTickCallback(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => {
      this.tickCallbacks.delete(cb);
    };
  }

  startLoop(): void {
    if (this._running) return;
    this._running = true;
    this.lastTimestamp = 0;
    if (this.state.order.length === 0) {
      this.generateOrder();
    }
    this.rafId = requestAnimationFrame(this.tick);
  }

  stopLoop(): void {
    this._running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resetLoop(): void {
    this.elapsedTime = 0;
    this.lastTimestamp = 0;
  }

  get isLoopRunning(): boolean {
    return this._running;
  }

  on(type: GameEventType, listener: GameEventListener): () => void {
    let set = this.eventListeners.get(type);
    if (!set) {
      set = new Set();
      this.eventListeners.set(type, set);
    }
    set.add(listener);
    return () => { set!.delete(listener); };
  }

  private emitEvent(event: GameEvent): void {
    this.eventListeners.get(event.type)?.forEach((l) => l(event));
  }

  getProduct(id: number): ProductData | undefined {
    return this.state.products.find((p) => p.id === id);
  }

  /**
   * Выбирает `count` **разных** товаров из полного списка реестра.
   * Каждый вызов заново перемешивает каталог — следующий заказ снова из тех же id,
   * но свой случайный набор; повторы одного товара внутри одного заказа невозможны.
   */
  private pickUniqueRandomItemIds(count: number): string[] {
    const pool = itemRegistry.getAllItems().map((item) => item.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const take = Math.min(count, pool.length);
    return pool.slice(0, take);
  }

  private buildRandomOrder(): OrderItem[] {
    return this.pickUniqueRandomItemIds(ORDER_SIZE).map((itemId) => ({
      itemId,
      collected: false,
    }));
  }

  generateOrder(): void {
    this.state = { ...this.state, order: this.buildRandomOrder() };
    this.emit();
  }

  private tickTimer(delta: number): void {
    if (this.state.gameOver) return;

    const newTimeLeft = this.state.orderTimeLeft - delta;
    if (newTimeLeft <= 0) {
      // Время вышло — game over
      this.state = {
        ...this.state,
        orderTimeLeft: 0,
        gameOver: true,
        isRunning: false,
      };
      this.stopLoop();
      this.emit();
    } else {
      this.state = { ...this.state, orderTimeLeft: newTimeLeft };
      this.emit();
    }
  }

  private tickCatch(): void {
    if (this.state.gameOver) return;

    const { playerZone, order } = this.state;
    const products = this.state.products;
    let scoreChange = 0;
    let changed = false;
    const caught: Array<{ product: ProductData; inOrder: boolean }> = [];
    const collectedItemIds: string[] = [];

    const nextProducts = products.filter((p) => {
      if (p.zone !== playerZone || p.progress < CATCH_THRESHOLD) return true;

      const orderEntry = order.find((o) => o.itemId === p.itemId && !o.collected);
      const inOrder = !!orderEntry;

      if (inOrder) {
        collectedItemIds.push(p.itemId);
        scoreChange += SCORE_HIT;
      } else {
        scoreChange += SCORE_MISS;
      }

      caught.push({ product: { ...p }, inOrder });
      changed = true;
      return false;
    });

    if (changed) {
      let nextScore = this.state.score + scoreChange;

      const pendingIds = [...collectedItemIds];
      let nextOrder = order.map((o) => {
        if (!o.collected) {
          const idx = pendingIds.indexOf(o.itemId);
          if (idx !== -1) {
            pendingIds.splice(idx, 1);
            return { ...o, collected: true };
          }
        }
        return o;
      });

      let nextOrderNumber = this.state.orderNumber;
      let nextOrdersCompleted = this.state.ordersCompleted;
      let nextTimeLeft = this.state.orderTimeLeft;

      const orderComplete =
        nextOrder.length > 0 && nextOrder.every((o) => o.collected);
      if (orderComplete) {
        nextScore += SCORE_ORDER_COMPLETE;
        nextOrderNumber += 1;
        nextOrdersCompleted += 1;
        nextTimeLeft = ORDER_TIME_LIMIT; // сбрасываем таймер
        nextOrder = this.buildRandomOrder();
      }

      this.state = {
        ...this.state,
        products: nextProducts,
        score: nextScore,
        order: nextOrder,
        orderNumber: nextOrderNumber,
        ordersCompleted: nextOrdersCompleted,
        orderTimeLeft: nextTimeLeft,
      };
      for (const c of caught) {
        this.emitEvent({ type: 'caught', product: c.product, inOrder: c.inOrder });
      }
      this.emit();
    }
  }

  private pickItemId(): string {
    this.spawnsSinceOrder++;
    if (this.spawnsSinceOrder >= this.nextOrderSpawn) {
      this.spawnsSinceOrder = 0;
      this.nextOrderSpawn = this.randomInt(2, 5);
      const uncollected = this.state.order.filter((o) => !o.collected);
      if (uncollected.length > 0) {
        return uncollected[Math.floor(Math.random() * uncollected.length)].itemId;
      }
    }
    return itemRegistry.getRandomItem().id;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private tickProducts(delta: number): void {
    let changed = false;

    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = SPAWN_INTERVAL;
      const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
      const itemId = this.pickItemId();
      this.state.products.push({
        id: nextProductId++,
        itemId,
        zone,
        progress: 0,
        speed: PRODUCT_SPEED,
        status: 'moving',
      });
      changed = true;
    }

    const falling: ProductData[] = [];

    const before = this.state.products.length;
    const nextProducts = this.state.products
      .filter((p) => p.status === 'moving')
      .map((p) => {
        const newProgress = p.progress + delta * p.speed;
        if (newProgress >= 1) {
          falling.push({ ...p, status: 'falling' as ProductStatus });
          return null;
        }
        return { ...p, progress: newProgress };
      })
      .filter((p): p is ProductData => p !== null);

    if (nextProducts.length !== before) changed = true;

    this.state = { ...this.state, products: nextProducts };

    for (const p of falling) {
      this.emitEvent({ type: 'falling', product: p });
    }

    if (changed) this.emit();
  }

  private tick = (timestamp: number): void => {
    if (!this._running) return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.elapsedTime += delta;

    const frame: FrameInfo = {
      delta,
      elapsed: this.elapsedTime,
      timestamp,
    };

    this.tickTimer(delta);
    this.tickProducts(delta);
    this.tickCatch();
    this.tickCallbacks.forEach((cb) => cb(frame, this));

    this.rafId = requestAnimationFrame(this.tick);
  };

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}
