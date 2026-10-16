
import ImageLayer from 'ol/layer/Image';
import ImageCanvas from 'ol/source/ImageCanvas';
import { fromLonLat } from 'ol/proj';

const BANDWIDTH_M = 900;        // ground distance of the smoothing kernel (1 sigma)
const MIN_SIGMA_PX = 12;        // keep the kernel visible when zoomed far out
const MAX_SIGMA_PX = 56;        // and bounded when zoomed far in
const CELL_PX = 4;              // density grid resolution (smoothed on draw)
const FULL_HEAT_POINTS = 4;     // at least this many co-located points = full red
const FADE_START = 0.06;        // below this relative density nothing is drawn
const FADE_END = 0.2;           // fully opaque from here up

// blue → cyan-green → yellow → orange → red
const STOPS = [
  [0.0, [49, 54, 149]],
  [0.2, [69, 117, 180]],
  [0.4, [116, 196, 118]],
  [0.6, [254, 224, 144]],
  [0.8, [244, 109, 67]],
  [1.0, [165, 0, 38]],
];

export const HEAT_GRADIENT_CSS = `linear-gradient(90deg, ${STOPS.map(([p, c]) => `rgb(${c.join(',')}) ${p * 100}%`).join(', ')})`;

const LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    let k = 0;
    while (k < STOPS.length - 2 && t > STOPS[k + 1][0]) k += 1;
    const [t0, c0] = STOPS[k];
    const [t1, c1] = STOPS[k + 1];
    const f = (t - t0) / (t1 - t0);
    for (let j = 0; j < 3; j += 1) lut[i * 3 + j] = c0[j] + (c1[j] - c0[j]) * f;
  }
  return lut;
})();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Identical coordinates (many workers share one stop) collapse into one
// weighted point so thousands of records stay cheap to draw.
function toWeightedPoints(lonLats) {
  const spots = new Map();
  lonLats.forEach(({ lon, lat }) => {
    const lo = Number(lon);
    const la = Number(lat);
    if (!Number.isFinite(lo) || !Number.isFinite(la) || Math.abs(lo) > 180 || Math.abs(la) > 90) return;
    const key = `${lo.toFixed(5)},${la.toFixed(5)}`;
    const spot = spots.get(key);
    if (spot) { spot.w += 1; return; }
    const [x, y] = fromLonLat([lo, la]);
    spots.set(key, { x, y, w: 1 });
  });
  return Array.from(spots.values());
}

/**
 * pointSets: { [layerKey]: [{ lon, lat }, ...] }
 * Returns an OpenLayers layer; call layer.get('setActiveKeys')(keys) to choose
 * which sets are counted (empty array = all of them).
 */
export function createDensityHeatmap(pointSets) {
  const byKey = {};
  Object.entries(pointSets).forEach(([key, list]) => { byKey[key] = toWeightedPoints(list); });
  let activeKeys = Object.keys(byKey);

  function render(extent, resolution, pixelRatio, size) {
    const [width, height] = size;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const unitsPerPx = (extent[2] - extent[0]) / width;
    const sigmaPx = clamp(BANDWIDTH_M / unitsPerPx, MIN_SIGMA_PX * pixelRatio, MAX_SIGMA_PX * pixelRatio);
    const sigma = sigmaPx / CELL_PX;            // in grid cells
    const radius = Math.ceil(sigma * 3);
    const gw = Math.ceil(width / CELL_PX) + 1;
    const gh = Math.ceil(height / CELL_PX) + 1;

    const side = radius * 2 + 1;
    const kernel = new Float32Array(side * side);
    for (let j = 0; j < side; j += 1) {
      for (let i = 0; i < side; i += 1) {
        const dx = i - radius;
        const dy = j - radius;
        kernel[j * side + i] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }

    const grid = new Float32Array(gw * gh);
    let any = false;
    activeKeys.forEach((key) => {
      (byKey[key] || []).forEach((p) => {
        const cx = Math.floor(((p.x - extent[0]) / unitsPerPx) / CELL_PX);
        const cy = Math.floor(((extent[3] - p.y) / unitsPerPx) / CELL_PX);
        if (cx < -radius || cy < -radius || cx > gw + radius || cy > gh + radius) return;
        any = true;
        const y0 = Math.max(0, cy - radius);
        const y1 = Math.min(gh - 1, cy + radius);
        const x0 = Math.max(0, cx - radius);
        const x1 = Math.min(gw - 1, cx + radius);
        for (let y = y0; y <= y1; y += 1) {
          const krow = (y - cy + radius) * side - cx + radius;
          const grow = y * gw;
          for (let x = x0; x <= x1; x += 1) grid[grow + x] += p.w * kernel[krow + x];
        }
      });
    });
    if (!any) return canvas;

    let max = 0;
    for (let i = 0; i < grid.length; i += 1) if (grid[i] > max) max = grid[i];
    // Log scale: 1 point ≈ pale blue, the busiest area = red, and the areas in
    // between stay visible instead of fading out next to one huge hotspot.
    const logMax = Math.log1p(Math.max(max, FULL_HEAT_POINTS));

    const img = new ImageData(gw, gh);
    for (let i = 0; i < grid.length; i += 1) {
      const d = Math.log1p(grid[i]) / logMax;
      const alpha = smoothstep(FADE_START, FADE_END, d);
      if (alpha <= 0) continue;
      const c = Math.round(clamp(d, 0, 1) * 255) * 3;
      const o = i * 4;
      img.data[o] = LUT[c];
      img.data[o + 1] = LUT[c + 1];
      img.data[o + 2] = LUT[c + 2];
      img.data[o + 3] = Math.round(alpha * 255);
    }
    const small = document.createElement('canvas');
    small.width = gw;
    small.height = gh;
    small.getContext('2d').putImageData(img, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, gw * CELL_PX, gh * CELL_PX);
    return canvas;
  }

  const source = new ImageCanvas({ canvasFunction: render, ratio: 1.2 });
  const layer = new ImageLayer({ source, opacity: 0.78 });
  layer.set('isHeatmap', true);
  layer.set('setActiveKeys', (keys) => {
    activeKeys = keys && keys.length ? keys : Object.keys(byKey);
    source.changed();
  });
  return layer;
}