/**
 * Удаляет «шахматный» серый фон экспорта без потери чёрных/серых деталей (улыбка, текст на коробках).
 *
 * Раньше отбрасывались все пути с низкой RGB-хромой — вместе с ними пропадали почти монохромные
 * контуры букв и линии лица. Теперь удаляем только:
 * - плитки сетки (~25×25 px по ограничивающему прямоугольнику по всем точкам в `d`);
 * - широкие горизонтальные полосы фона у верхнего и нижнего края холста.
 *
 * Цветные элементы курьера (хрома ≥ 7) не трогаем.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FILES = [
  'src/pages/game/images/courier-up.svg',
  'src/pages/game/images/courier-down.svg',
];

/** max(r,g,b) - min(r,g,b) в 0..255 */
function rgbChroma(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

const GROUP_RE = /<g><path style="opacity:1" fill="#([0-9a-f]{6})" d="([^"]*)"\/><\/g>/gi;

const NUM_RE = /-?[0-9]+(?:\.[0-9]+)?/g;

/** Ось-выровненный bbox по всем числовым парам в `d` (достаточно для классификации плиток/полос). */
function pathBBoxFromD(d) {
  const nums = d.match(NUM_RE);
  if (!nums || nums.length < 2) return null;
  const xs = [];
  const ys = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(Number(nums[i]));
    ys.push(Number(nums[i + 1]));
  }
  if (!xs.length) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

/** Клетка шахматной сетки экспорта — квадрат ~25 px. */
function isGridTile(b) {
  return b.w > 18 && b.w < 40 && b.h > 18 && b.h < 40;
}

/** Длинные полосы того же фона у верхнего / нижнего края (не текст на коробках по центру). */
function isEdgeCheckerboardStrip(b) {
  return b.w > 70 && b.h <= 55 && (b.minY < 120 || b.maxY > 900);
}

function shouldDropLowChromaPath(d) {
  const b = pathBBoxFromD(d);
  if (!b) return false;
  return isGridTile(b) || isEdgeCheckerboardStrip(b);
}

function stripFile(relPath) {
  const abs = join(ROOT, relPath);
  const lines = readFileSync(abs, 'utf8').split('\n');
  const out = [];

  for (const line of lines) {
    if (!line.includes('<g><path') || !line.includes('fill="#')) {
      out.push(line);
      continue;
    }
    GROUP_RE.lastIndex = 0;
    const m = GROUP_RE.exec(line);
    if (!m) {
      out.push(line);
      continue;
    }
    const hex = m[1];
    const d = m[2];
    if (rgbChroma(`#${hex}`) >= 7) {
      out.push(line);
      continue;
    }
    if (shouldDropLowChromaPath(d)) {
      continue;
    }
    out.push(line);
  }

  writeFileSync(abs, out.join('\n'), 'utf8');
  console.log(`OK ${relPath}: ${lines.length} -> ${out.length} lines`);
}

for (const f of FILES) {
  stripFile(f);
}
