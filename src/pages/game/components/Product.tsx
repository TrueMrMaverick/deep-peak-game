import { useRef } from 'react';
import { ItemRegistry } from '../../../game/ItemRegistry';
import { useGameStoreContext } from '../store';
import { useGameLoop } from '../store/useGameLoop';
import './Product.css';

const registry = ItemRegistry.getInstance();

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

  const product = store.getProduct(productId);
  const item = product ? registry.getItem(product.itemId) : undefined;
  const src = item?.imageUrl;
  const alt = item?.name ?? 'товар';

  return (
    <div ref={ref} className="Product-root">
      {src ? (
        <img src={src} alt={alt} className="Product-img" draggable={false} />
      ) : null}
    </div>
  );
}
