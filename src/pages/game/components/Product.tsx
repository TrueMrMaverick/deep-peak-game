import { useCallback, useRef } from 'react';
import { ShelfZone } from '../store';
import { useGameLoop } from '../store/useGameLoop';
import './Product.css';

interface ProductProps {
  zone: ShelfZone;
  lane: number;
  speed: number;
  delay: number;
  onFinish: () => void;
}

/**
 * Direction vectors per zone — products fly FROM the vanishing point
 * (outer corner of zone) TOWARDS the viewer (center of screen).
 *
 * originX/Y: starting position inside zone (0-100 %)
 * dirX/dirY:  movement direction towards center
 */
const ZONE_CONFIG: Record<ShelfZone, { originX: number; originY: number; dirX: number; dirY: number }> = {
  'top-left':     { originX: 0,   originY: 0,   dirX:  1, dirY:  1 },
  'top-right':    { originX: 100, originY: 0,   dirX: -1, dirY:  1 },
  'bottom-left':  { originX: 0,   originY: 100, dirX:  1, dirY: -1 },
  'bottom-right': { originX: 100, originY: 100, dirX: -1, dirY: -1 },
};

const START_SCALE = 0.08;
const END_SCALE = 1.4;
const TRAVEL = 55;

export function Product({ zone, lane, speed, delay, onFinish }: ProductProps) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(-delay);

  const { originX, originY, dirX, dirY } = ZONE_CONFIG[zone];

  const tick = useCallback(
    (frame: { delta: number }) => {
      progressRef.current += frame.delta * speed;
      const t = progressRef.current;

      if (t < 0) {
        if (ref.current) ref.current.style.opacity = '0';
        return;
      }

      if (t >= 1) {
        onFinish();
        return;
      }

      const el = ref.current;
      if (!el) return;

      const ease = t * t;
      const scale = START_SCALE + (END_SCALE - START_SCALE) * ease;
      const x = originX + dirX * TRAVEL * ease;
      const y = originY + dirY * TRAVEL * ease;

      el.style.opacity = String(Math.min(t * 4, 1));
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.left = `${x}%`;
      el.style.top = `${y + lane}%`;
    },
    [zone, lane, speed, onFinish, originX, originY, dirX, dirY],
  );

  useGameLoop(tick);

  return <div ref={ref} className="Product-root" style={{ opacity: 0 }} />;
}
