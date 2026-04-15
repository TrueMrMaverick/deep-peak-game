import { useRef } from 'react';
import { useGameStoreContext } from '../store';
import { useGameLoop } from '../store/useGameLoop';
import './Product.css';

export interface AnimationPoint {
  x: number;
  y: number;
  scale: number;
}

interface ProductProps {
  productId: number;
  from: AnimationPoint;
  to: AnimationPoint;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function Product({ productId, from, to }: ProductProps) {
  const ref = useRef<HTMLDivElement>(null);
  const store = useGameStoreContext();

  useGameLoop(() => {
    const el = ref.current;
    if (!el) return;

    const product = store.getProduct(productId);
    if (!product) return;

    const t = Math.min(Math.max(product.progress, 0), 1);
    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    const scale = lerp(from.scale, to.scale, t);

    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
  });

  return <div ref={ref} className="Product-root" />;
}
