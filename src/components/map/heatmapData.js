// Pure data helpers for the density heatmap (no OpenLayers / DOM imports so
// they can be unit-tested with `node --test`).
import { LAYER_DEFS } from './layerDefs.js';

// Points closer than roughly this (~110 m) are counted as the same spot when
// working out how "hot" the busiest spot is.
const BIN_DEGREES = 0.001;
const MIN_WEIGHT = 0.05;

function toNumber(value) {
  // Number(null) and Number('') are 0, which would silently become a real
  // coordinate. Treat them as missing instead.
  if (value === null || value === undefined || value === '') return NaN;
  return Number(value);
}

// Returns a clean { lon, lat } or null when the location is missing/invalid.
// (0, 0) is rejected: it is what a null latitude/longitude collapses to, and
// no worker location sits in the Gulf of Guinea.
export function readCoord(coords) {
  if (!coords) return null;
  const lon = toNumber(coords.lon);
  const lat = toNumber(coords.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  if (lon === 0 && lat === 0) return null;
  return { lon, lat };
}

// Every valid location of the *enabled* location types, one point each.
// `enabled` is the map's layer visibility object, e.g. { home: true, start: false, ... }.
export function collectHeatPoints(workers, enabled, defs = LAYER_DEFS) {
  const points = [];
  defs.forEach((def) => {
    if (!enabled?.[def.key]) return;
    (workers || []).forEach((worker) => {
      const coord = readCoord(worker?.[def.field]);
      if (coord) points.push({ ...coord, layer: def.key });
    });
  });
  return points;
}

// Weight (0..1) given to every point so density is readable.
// The heatmap adds point weights together and clamps at 1, so with a weight of
// 1 just two nearby points already paint the hottest colour and any stop that
// many workers share becomes a flat dark-red blob. Scaling the weight by the
// busiest spot keeps that spot hot while lone points still show as faint.
export function heatWeight(points) {
  if (!points.length) return 1;
  const bins = new Map();
  let busiest = 0;
  points.forEach(({ lon, lat }) => {
    const key = `${Math.round(lon / BIN_DEGREES)}:${Math.round(lat / BIN_DEGREES)}`;
    const count = (bins.get(key) || 0) + 1;
    bins.set(key, count);
    if (count > busiest) busiest = count;
  });
  return Math.min(1, Math.max(MIN_WEIGHT, 1 / Math.sqrt(busiest)));
}

// Convenience: points plus the shared weight, ready to become map features.
export function buildHeatPoints(workers, enabled, defs = LAYER_DEFS) {
  const points = collectHeatPoints(workers, enabled, defs);
  const weight = heatWeight(points);
  return points.map((point) => ({ ...point, weight }));
}
