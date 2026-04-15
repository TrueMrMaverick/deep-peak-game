/**
 * Удаляет фон экспорта (подложка, сетка, полосы, гуттеры) без потери деталей курьера.
 *
 * Низкохромные пути (почти серые/чёрные) снимаем, если это похоже на:
 * - сплошную подложку на весь холст;
 * - клетку ~25×25 (в т.ч. когда сторона ровно 18 px — экспорт раньше не ловил `w > 18`);
 * - слитый блок 2×2 (~51×51) или «домино» ~51×25 / 25×51;
 * - почти квадратный фрагмент сетки ~40×44;
 * - широкую полосу фона у верхнего/нижнего края;
 * - узкий вертикальный гуттер (ширина до 6 px);
 * - тонкую горизонталь у верхнего/нижнего края (полоса по Y расширена к низу холста);
 * - низкую горизонтальную «плитку» сетки у самого верха/низа (например 25×17 у края);
 * - остатки сетки в зоне между ногами (мелкие квадраты ~15–28 px, узкие линии, полосы ~77×25);
 * - длинные горизонтальные полосы шахматного ряда (ширина сотни px, высота ~25–110);
 * - «стежки» у левого/правого края холста (фрагменты сетки с minX/maxX у 0/1024);
 * - высокие узкие столбы сетки (~100×250 и т.п.) вне силуэта;
 * - крупные серые пятна в зоне между ногами (остатки фона/тени);
 * - крупные тёмные низкохромные «плиты» (часто в courier-down: сотни×сотни px клеток фона).
 *
 * Дополнительно для хромы ≥ 7: отдельные тёмные сине-серые слои и вертикальные «столбы» фона
 * (см. shouldDropHighChromaDarkBackgroundBlob) — без затрагивания тёплых теней волос/кожи.
 *
 * Не удаляем похожие на «клетку» фрагменты с хромой ≥ 7 — часть формы тоже квадратными путями.
 *
 * Мелкие низкохромные штрихи (зубы #eae6e4, блики) сохраняются, если не попадают под геометрию сетки.
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

function rgbChroma(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** Относительная яркость sRGB, 0…1 (для отсечения светлых серых бликов). */
function rgbLuminance01(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const GROUP_RE = /<g><path style="opacity:1" fill="#([0-9a-f]{6})" d="([^"]*)"\/><\/g>/gi;

const NUM_RE = /-?[0-9]+(?:\.[0-9]+)?/g;

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

function isFullCanvasBackdrop(b) {
  return b.w > 900 && b.h > 900 && b.minX <= 2 && b.minY <= 2 && b.maxX >= 1000 && b.maxY >= 1000;
}

/** Одна клетка ~25 px (границы включительно, иначе 18×26 не попадали). */
function isGridTile(b) {
  return b.w >= 18 && b.w <= 40 && b.h >= 18 && b.h <= 40;
}

/** Слитый квадрат 2×2 (~51 px). */
function isMergedGridSquare(b) {
  return b.w >= 44 && b.w <= 60 && b.h >= 44 && b.h <= 60;
}

/**
 * Слитая «доминошка» 2×1 / 1×2. У вертикали узкий порог по ширине (~одна колонка), чтобы не съесть коробки.
 */
function isMergedGridDomino(b) {
  const horiz = b.w >= 44 && b.w <= 62 && b.h >= 20 && b.h <= 42;
  const vert = b.h >= 44 && b.h <= 62 && b.w >= 20 && b.w <= 32;
  return horiz || vert;
}

/**
 * Кусок сетки «почти квадрат», но не попавший в 18–40 (например 40×44).
 */
function isSquarishGridChunk(b) {
  if (b.w < 35 || b.w > 52 || b.h < 35 || b.h > 52) return false;
  const lo = Math.min(b.w, b.h);
  const hi = Math.max(b.w, b.h);
  return hi / lo <= 1.2;
}

function isEdgeCheckerboardStrip(b) {
  return b.w > 70 && b.h <= 55 && (b.minY < 120 || b.maxY > 900);
}

function isThinVerticalGridGutter(b) {
  return b.w <= 6 && b.h >= 18 && b.h <= 58;
}

function isThinHorizontalEdgeLint(b) {
  if (b.h > 12 || b.w < 10 || b.w > 120) return false;
  if (b.maxY <= 72) return true;
  if (b.minY >= 880) return true;
  return false;
}

/**
 * Узкая горизонтальная «плитка» сетки у самого верха/низа (25×17 и т.п.), не буквы по центру.
 */
function isGridRowFragmentAtCanvasEdge(b) {
  if (b.w < 18 || b.w > 58 || b.h < 12 || b.h > 24) return false;
  return b.maxY <= 85 || b.minY >= 915;
}

/** Центр bbox (для зон без «хвостов» за край кадра). */
function bboxCenter(b) {
  return { cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 };
}

/**
 * Нижняя центральная область — типичные хвосты шахматного фона между ногами.
 */
function isInLegGapZone(b) {
  const { cx, cy } = bboxCenter(b);
  return cx >= 300 && cx <= 740 && cy >= 460 && cy <= 840;
}

/**
 * Остатки сетки между ногами: мелкие клетки чуть меньше 18 px, узкие линии, короткие полосы.
 * Не трогаем крупные пятна персонажа (площадь и габариты ограничены).
 */
function isLegGapGridScrap(b) {
  if (!isInLegGapZone(b)) return false;

  const { w, h } = b;
  const area = w * h;

  if (w <= 13 && h >= 16 && h <= 34) return true;
  if (h <= 12 && w >= 14 && w <= 100) return true;

  if (w <= 14 && h <= 18 && w >= 8 && h >= 10 && area <= 220) return true;

  if (w >= 14 && w <= 32 && h >= 14 && h <= 32 && area <= 900) return true;

  if (w >= 48 && w <= 130 && h >= 14 && h <= 34 && area <= 3600) return true;

  return false;
}

/**
 * Длинная горизонтальная полоса шахматного ряда (часто 51 px по высоте, сотни px в ширину).
 * Курьер/коробка почти не дают столь широких низкохромных прямоугольников при такой малой высоте.
 */
function isLowChromaWideHorizontalBand(b) {
  if (b.w < 170) return false;
  if (b.h < 12 || b.h > 125) return false;
  return true;
}

/**
 * Средняя по ширине горизонтальная полоса ряда (~128–179×51 и т.д.), не силуэт (у силуэта выше контура).
 */
function isLowChromaMediumHorizontalGridRow(b) {
  if (b.w < 100 || b.w >= 170) return false;
  if (b.h < 15 || b.h > 78) return false;
  return true;
}

/**
 * Узкая, но заметная горизонтальная полоска сетки (~75–102×25).
 */
function isLowChromaNarrowHorizontalGridRow(b) {
  if (b.w < 65 || b.w > 130) return false;
  if (b.h < 14 || b.h > 35) return false;
  return true;
}

/**
 * «Кирпич» клетки ~77×52 у края поля — не деталь персонажа.
 */
function isLowChromaGridBrick(b) {
  if (b.w < 68 || b.w > 100) return false;
  if (b.h < 36 || b.h > 60) return false;
  return true;
}

/**
 * Фрагмент ряда, пришитый к левому/правому краю экспорта (minX/maxX у границы 1024×1024).
 */
function isLowChromaHorizontalCanvasEdgeStitch(b) {
  if (b.w < 70) return false;
  if (b.h < 14 || b.h > 130) return false;
  const nearLeft = b.minX < 14;
  const nearRight = b.maxX > 1010;
  return nearLeft || nearRight;
}

/**
 * Высокий узкий столб сетки (вертикальная полоса клеток), не похожий на деталь силуэта.
 */
function isLowChromaTallNarrowGridSlab(b) {
  if (b.h < 135) return false;
  if (b.w < 14 || b.w > 118) return false;
  return true;
}

/**
 * Крупные низкохромные заливки между ногами — остаток шахматки/лишней тени (раньше оставляли).
 */
function isLegGapLargeGreyBlob(b) {
  if (!isInLegGapZone(b)) return false;
  const area = b.w * b.h;
  if (area >= 3200) return true;
  if (b.w >= 45 && b.h >= 52) return true;
  return false;
}

/**
 * Узкий вертикальный хвост сетки у нижнего края (например ~27×72 у y≈926).
 */
function isLowChromaBottomVerticalGridTail(b) {
  if (b.maxY < 875) return false;
  if (b.w < 12 || b.w > 36) return false;
  if (b.h < 38 || b.h > 110) return false;
  return true;
}

/**
 * Крупные тёмные «плиты» низкохромного фона (в т.ч. courier-down: 500×283, 299×307 и т.д.).
 * Светлые серые блики (#efefeb и т.п.) не трогаем.
 */
function isLowChromaLargeDarkBackgroundSlab(hex, b) {
  const lum = rgbLuminance01(`#${hex}`);
  if (lum > 0.34) return false;

  const area = b.w * b.h;
  if (area < 9000) return false;

  if (area >= 14000) return true;

  if (b.w >= 200 && b.h >= 110) return true;
  if (b.h >= 200 && b.w >= 110) return true;

  if (area >= 9000 && (b.w >= 260 || b.h >= 260)) return true;

  return false;
}

function shouldDropLowChromaPath(d, hex) {
  const b = pathBBoxFromD(d);
  if (!b) return false;
  return (
    isFullCanvasBackdrop(b) ||
    isGridTile(b) ||
    isMergedGridSquare(b) ||
    isMergedGridDomino(b) ||
    isSquarishGridChunk(b) ||
    isEdgeCheckerboardStrip(b) ||
    isThinVerticalGridGutter(b) ||
    isThinHorizontalEdgeLint(b) ||
    isGridRowFragmentAtCanvasEdge(b) ||
    isLegGapGridScrap(b) ||
    isLowChromaWideHorizontalBand(b) ||
    isLowChromaMediumHorizontalGridRow(b) ||
    isLowChromaNarrowHorizontalGridRow(b) ||
    isLowChromaGridBrick(b) ||
    isLowChromaHorizontalCanvasEdgeStitch(b) ||
    isLowChromaTallNarrowGridSlab(b) ||
    isLegGapLargeGreyBlob(b) ||
    isLowChromaBottomVerticalGridTail(b) ||
    isLowChromaLargeDarkBackgroundSlab(hex, b)
  );
}

/**
 * Тёмные сине-серые «пятна» экспорта с хромой ≥ 7 (в courier-down особенно заметны):
 * вертикальные столбы клеток, крупный приглушённый слой под/рядом с формой.
 * Коричневые/тёплые тени (волосы, кожа) не трогаем: у них обычно max(R,G,B) даёт красноватый максимум.
 */
function shouldDropHighChromaDarkBackgroundBlob(hex, d) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const bl = parseInt(hex.slice(4, 6), 16);
  const mx = Math.max(r, g, bl);
  if (mx > 78) return false;

  const b = pathBBoxFromD(d);
  if (!b) return false;

  const area = b.w * b.h;
  const aspectV = b.h / Math.max(b.w, 1e-6);

  if (b.w <= 110 && b.h >= 250 && aspectV >= 2.5) return true;
  if (b.w <= 22 && b.h >= 115 && aspectV >= 4) return true;

  if (area >= 55_000 && mx <= 70 && bl >= r && bl >= g - 8) return true;

  return false;
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
      if (shouldDropHighChromaDarkBackgroundBlob(hex, d)) {
        continue;
      }
      out.push(line);
      continue;
    }
    if (shouldDropLowChromaPath(d, hex)) {
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
