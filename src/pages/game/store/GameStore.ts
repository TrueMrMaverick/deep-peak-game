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

export interface GameState {
  score: number;
  level: number;
  isRunning: boolean;
  playerZone: ShelfZone;
  products: ProductData[];
}

export interface FrameInfo {
  delta: number;
  elapsed: number;
  timestamp: number;
}

export type TickCallback = (frame: FrameInfo, store: GameStore) => void;

export type GameEventType = 'falling';

export interface GameEvent {
  type: GameEventType;
  product: ProductData;
}

export type GameEventListener = (event: GameEvent) => void;

type Listener = () => void;

const INITIAL_STATE: GameState = {
  score: 0,
  level: 1,
  isRunning: false,
  playerZone: 'top-left',
  products: [],
};

const SPAWN_INTERVAL = 1.2;
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
  private spawnTimers: Record<ShelfZone, number> = {
    'top-left': SPAWN_INTERVAL,
    'top-right': SPAWN_INTERVAL,
    'bottom-left': SPAWN_INTERVAL,
    'bottom-right': SPAWN_INTERVAL,
  };

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

  private tickProducts(delta: number): void {
    let changed = false;

    for (const zone of ZONES) {
      this.spawnTimers[zone] -= delta;
      if (this.spawnTimers[zone] <= 0) {
        this.spawnTimers[zone] = SPAWN_INTERVAL;
        const { id: itemId } = itemRegistry.getRandomItem();
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
    }

    const falling: ProductData[] = [];

    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => {
      if (p.status !== 'moving') return false;
      p.progress += delta * p.speed;
      if (p.progress >= 1) {
        p.status = 'falling';
        falling.push(p);
        return false;
      }
      return true;
    });
    if (this.state.products.length !== before) changed = true;

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

    this.tickProducts(delta);
    this.tickCallbacks.forEach((cb) => cb(frame, this));

    this.rafId = requestAnimationFrame(this.tick);
  };

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}
