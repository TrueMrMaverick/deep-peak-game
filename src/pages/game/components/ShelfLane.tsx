import { useCallback, useRef, useState } from 'react';
import { ShelfZone } from '../store';
import { useGameLoop } from '../store/useGameLoop';
import { Product } from './Product';

interface SpawnedProduct {
  id: number;
  lane: number;
  speed: number;
  delay: number;
}

interface ShelfLaneProps {
  zone: ShelfZone;
}

const SPAWN_INTERVAL_MIN = 0.8;
const SPAWN_INTERVAL_MAX = 2.0;
const SPEED_MIN = 0.25;
const SPEED_MAX = 0.5;
const LANE_MIN = -15;
const LANE_MAX = 15;

let nextId = 0;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ShelfLane({ zone }: ShelfLaneProps) {
  const [products, setProducts] = useState<SpawnedProduct[]>([]);
  const nextSpawnRef = useRef(rand(0, SPAWN_INTERVAL_MIN));

  const spawnTick = useCallback(
    (frame: { delta: number }) => {
      nextSpawnRef.current -= frame.delta;
      if (nextSpawnRef.current <= 0) {
        nextSpawnRef.current = rand(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX);
        const product: SpawnedProduct = {
          id: nextId++,
          lane: rand(LANE_MIN, LANE_MAX),
          speed: rand(SPEED_MIN, SPEED_MAX),
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
          zone={zone}
          lane={p.lane}
          speed={p.speed}
          delay={p.delay}
          onFinish={() => handleFinish(p.id)}
        />
      ))}
    </>
  );
}
