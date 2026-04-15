import { ShelfLane } from './ShelfLane';
import './Shelves.css';

export function Shelves() {
  return (
    <div className="Shelves-root">
      <div className="Shelves-zone">
        <ShelfLane
          zone="top-left"
          to={{ x: 60, y: 80, scale: 1 }}
          from={{ x: 10, y: 70, scale: 5 }}
        />
      </div>
      <div className="Shelves-zone">
        <ShelfLane
          zone="top-right"
          from={{ x: 90, y: 70, scale: 5 }}
          to={{ x: 20, y: 80, scale: 1 }}
        />
      </div>
      <div className="Shelves-zone">
        <ShelfLane
          zone="bottom-left"
          from={{ x: 10, y: 90, scale: 5 }}
          to={{ x: 65, y: 25, scale: 1 }}
        />
      </div>
      <div className="Shelves-zone">
        <ShelfLane
          zone="bottom-right"
          from={{ x: 90, y: 90, scale: 5 }}
          to={{ x: 35, y: 25, scale: 1 }}
        />
      </div>
    </div>
  );
}
