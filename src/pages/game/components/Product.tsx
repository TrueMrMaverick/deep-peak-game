import { useCallback, useRef } from 'react';
import { useGameLoop } from '../store/useGameLoop';
import './Product.css';

export interface AnimationPoint {
  x: number;
  y: number;
  scale: number;
}

interface ProductProps {
  from: AnimationPoint;
  to: AnimationPoint;
  lane: number;
  speed: number;
  delay: number;
  onFinish: () => void;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function Product({ from, to, lane, speed, delay, onFinish }: ProductProps) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(-delay);

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

      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t) + lane;
      const scale = lerp(from.scale, to.scale, t);

      el.style.opacity = '1';
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
    },
    [from, to, lane, speed, onFinish],
  );

  useGameLoop(tick);

  return <div ref={ref} className="Product-root" style={{ opacity: 0 }} />;
}
