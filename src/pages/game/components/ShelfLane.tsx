import { useMemo } from 'react';
import { ShelfZone, useGame } from '../store';
import { AnimationPoint, Product } from './Product';

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

export function ShelfLane({ zone, from, to }: ShelfLaneProps) {
  const defaults = ZONE_DEFAULTS[zone];
  const resolvedFrom = from ?? defaults.from;
  const resolvedTo = to ?? defaults.to;

  const productIds = useGame((s) => {
    const ids = s.products.filter((p) => p.zone === zone).map((p) => p.id);
    return ids.join(',');
  });

  const ids = useMemo(() => (productIds ? productIds.split(',').map(Number) : []), [productIds]);

  return (
    <>
      {ids.map((id) => (
        <Product
          key={id}
          productId={id}
          from={resolvedFrom}
          to={resolvedTo}
        />
      ))}
    </>
  );
}
