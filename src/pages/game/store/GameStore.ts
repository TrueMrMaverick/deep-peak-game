import { ItemRegistry } from '../../../game/ItemRegistry';

export type ShelfZone = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ProductStatus = 'moving' | 'catchable' | 'falling';

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
  orderNumber: number;
  courierArmsUp: boolean;
  courierMirrored: boolean;
}

export interface FrameInfo {
  delta: number;
  elapsed: number;
  timestamp: number;
}

export type TickCallback = (frame: FrameInfo, store: GameStore) => void;

type Listener = () => void;

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
};

const CATCH_THRESHOLD = 0.9;
const SCORE_HIT = 100;
const SCORE_MISS = -100;
const SCORE_ORDER_COMPLETE = 500;
const ORDER_SIZE = 5;

const SPAWN_INTERVAL = 1.5;
const PRODUCT_SPEED = 0.35;
const ZONES: ShelfZone[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

let nextProductId = 0;

const itemRegistry = ItemRegistry.getInstance();

export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();

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
    if (partial.playerZone !== undefined) {
      console.log('[GameStore] playerZone:', partial.playerZone);
    }
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

  getProduct(id: number): ProductData | undefined {
    return this.state.products.find((p) => p.id === id);
  }

  private pickUniqueRandomItemIds(count: number): string[] {
    const pool = itemRegistry.getAllItems().map((item) => item.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(count, pool.length));
  }

  buildRandomOrder(): OrderItem[] {
    return this.pickUniqueRandomItemIds(ORDER_SIZE).map((itemId) => ({
      itemId,
      collected: false,
    }));
  }

  generateOrder(): void {
    this.state = { ...this.state, order: this.buildRandomOrder() };
    this.emit();
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

    const { playerZone, order } = this.state;
    let scoreChange = 0;
    let hasCatch = false;

    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => {
      p.progress += delta * p.speed;

      if (p.progress >= 1) return false;

      if (p.status === 'moving' && p.progress >= CATCH_THRESHOLD) {
        p.status = 'catchable';
      }

      if (p.status === 'catchable' && p.zone === playerZone) {
        const orderEntry = order.find((o) => o.itemId === p.itemId && !o.collected);
        if (orderEntry) {
          orderEntry.collected = true;
          scoreChange += SCORE_HIT;
        } else {
          scoreChange += SCORE_MISS;
        }
        hasCatch = true;
        return false;
      }

      return true;
    });

    if (this.state.products.length !== before) changed = true;

    if (hasCatch) {
      const orderComplete = order.length > 0 && order.every((o) => o.collected);
      if (orderComplete) scoreChange += SCORE_ORDER_COMPLETE;

      this.state = {
        ...this.state,
        score: this.state.score + scoreChange,
        order: orderComplete ? this.buildRandomOrder() : [...order],
        orderNumber: this.state.orderNumber + (orderComplete ? 1 : 0),
      };
      changed = true;
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

    this.tickProducts(delta);
    this.tickCallbacks.forEach((cb) => cb(frame, this));

    this.rafId = requestAnimationFrame(this.tick);
  };

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}
