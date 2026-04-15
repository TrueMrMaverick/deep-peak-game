import { useCallback, useRef, useState } from 'react';
import { ShelfZone } from '../store';
import { useGameLoop } from '../store/useGameLoop';
import { AnimationPoint, Product } from './Product';

interface SpawnedProduct {
  id: number;
  lane: number;
  speed: number;
  delay: number;
}

interface ShelfLaneProps {
  zone: ShelfZone;
  from?: AnimationPoint;
  to?: AnimationPoint;
}

const ZONE_DEFAULTS: Record<ShelfZone, { from: AnimationPoint; to: AnimationPoint }> = {
  'top-left':     { from: { x: 100, y: 100, scale: 0.08 }, to: { x: 45,  y: 45,  scale: 1.4 } },
  'top-right':    { from: { x: 0,   y: 100, scale: 0.08 }, to: { x: 55,  y: 45,  scale: 1.4 } },
  'bottom-left':  { from: { x: 100, y: 0,   scale: 0.08 }, to: { x: 45,  y: 55,  scale: 1.4 } },
  'bottom-right': { from: { x: 0,   y: 0,   scale: 0.08 }, to: { x: 55,  y: 55,  scale: 1.4 } },
};

const SPAWN_INTERVAL = 1.2;
const SPEED = 0.35;

let nextId = 0;

export function ShelfLane({ zone, from, to }: ShelfLaneProps) {
  const defaults = ZONE_DEFAULTS[zone];
  const resolvedFrom = from ?? defaults.from;
  const resolvedTo = to ?? defaults.to;

  const [products, setProducts] = useState<SpawnedProduct[]>([]);
  const nextSpawnRef = useRef(SPAWN_INTERVAL);

  const spawnTick = useCallback(
    (frame: { delta: number }) => {
      nextSpawnRef.current -= frame.delta;
      if (nextSpawnRef.current <= 0) {
        nextSpawnRef.current = SPAWN_INTERVAL;
        const product: SpawnedProduct = {
          id: nextId++,
          lane: 0,
          speed: SPEED,
          delay: 0,
        };
        setProducts((prev) => [...prev, product]);
      }
    },
    [],
  );

  useGameLoop(spawnTick);

  const handleFinish = useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <>
      {products.map((p) => (
        <Product
          key={p.id}
          from={resolvedFrom}
          to={resolvedTo}
          lane={p.lane}
          speed={p.speed}
          delay={p.delay}
          onFinish={() => handleFinish(p.id)}
        />
      ))}
    </>
  );
}
