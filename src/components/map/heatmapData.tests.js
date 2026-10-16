import test from 'node:test';
import assert from 'node:assert/strict';
import { LAYER_DEFS } from './layerDefs.js';
import { buildHeatPoints, collectHeatPoints, heatWeight, readCoord } from './heatmapData.js';

const ALL_ON = { home: true, start: true, boarding: true, after_work: true };

function worker(over = {}) {
  return {
    home_coords: { lon: 38.70, lat: 9.00 },
    start_point_coords: { lon: 38.71, lat: 9.01 },
    boarding_coords: { lon: 38.72, lat: 9.02 },
    after_work_bus_pickup_coords: { lon: 38.73, lat: 9.03 },
    ...over,
  };
}

test('LAYER_DEFS covers the four location types', () => {
  assert.deepEqual(LAYER_DEFS.map((d) => d.key), ['home', 'start', 'boarding', 'after_work']);
});

test('readCoord accepts valid coordinates, including numeric strings', () => {
  assert.deepEqual(readCoord({ lon: 38.75, lat: 9.02 }), { lon: 38.75, lat: 9.02 });
  assert.deepEqual(readCoord({ lon: '38.75', lat: '9.02' }), { lon: 38.75, lat: 9.02 });
  assert.deepEqual(readCoord({ lon: 38.75, lat: 0 }), { lon: 38.75, lat: 0 }); // on the equator is valid
});

test('readCoord rejects missing, null, non-numeric and out-of-range values', () => {
  [null, undefined, {}, { lon: null, lat: null }, { lon: '', lat: '' }, { lon: 'x', lat: 9 },
    { lon: NaN, lat: 9 }, { lon: 181, lat: 9 }, { lon: 38, lat: -91 }].forEach((bad) => {
    assert.equal(readCoord(bad), null, JSON.stringify(bad));
  });
});

test('readCoord rejects (0, 0), which is what a null lat/lon collapses to', () => {
  assert.equal(readCoord({ lon: 0, lat: 0 }), null);
});

test('collectHeatPoints includes every one of the four location types', () => {
  const points = collectHeatPoints([worker()], ALL_ON);
  assert.equal(points.length, 4);
  assert.deepEqual(points.map((p) => p.layer).sort(), ['after_work', 'boarding', 'home', 'start']);
});

test('collectHeatPoints only uses the enabled location types', () => {
  LAYER_DEFS.forEach((def) => {
    const only = { home: false, start: false, boarding: false, after_work: false, [def.key]: true };
    const points = collectHeatPoints([worker(), worker()], only);
    assert.equal(points.length, 2, def.key);
    assert.ok(points.every((p) => p.layer === def.key), def.key);
  });
  assert.equal(collectHeatPoints([worker()], { home: false, start: false, boarding: false, after_work: false }).length, 0);
  assert.equal(collectHeatPoints([worker()], undefined).length, 0);
});

test('collectHeatPoints skips workers with missing or invalid locations only', () => {
  const workers = [
    worker({ home_coords: null }),
    worker({ boarding_coords: { lon: 0, lat: 0 } }),
    worker({ start_point_coords: undefined, after_work_bus_pickup_coords: { lon: NaN, lat: 9 } }),
  ];
  const points = collectHeatPoints(workers, ALL_ON);
  // 3 workers x 4 types = 12, minus 1 + 1 + 2 invalid
  assert.equal(points.length, 8);
});

test('collectHeatPoints tolerates empty or missing input', () => {
  assert.deepEqual(collectHeatPoints([], ALL_ON), []);
  assert.deepEqual(collectHeatPoints(undefined, ALL_ON), []);
  assert.deepEqual(collectHeatPoints([null, undefined], ALL_ON), []);
});

test('heatWeight is full for empty or isolated points', () => {
  assert.equal(heatWeight([]), 1);
  assert.equal(heatWeight([{ lon: 38.7, lat: 9.0 }]), 1);
  assert.equal(heatWeight([{ lon: 38.7, lat: 9.0 }, { lon: 38.9, lat: 9.2 }]), 1);
});

test('heatWeight scales down with the busiest spot (1 / sqrt(count))', () => {
  const stack = (n) => Array.from({ length: n }, () => ({ lon: 38.7, lat: 9.0 }));
  assert.equal(heatWeight(stack(4)), 0.5);
  assert.equal(heatWeight(stack(25)), 0.2);
  assert.ok(heatWeight(stack(100)) < heatWeight(stack(25)));
});

test('heatWeight never drops below its floor', () => {
  const stack = Array.from({ length: 10000 }, () => ({ lon: 38.7, lat: 9.0 }));
  assert.equal(heatWeight(stack), 0.05);
});

test('heatWeight counts nearby points as one spot but distant points separately', () => {
  const near = [{ lon: 38.7000, lat: 9.0 }, { lon: 38.7002, lat: 9.0 }, { lon: 38.7004, lat: 9.0 }, { lon: 38.7001, lat: 9.0001 }];
  const far = [{ lon: 38.70, lat: 9.0 }, { lon: 38.80, lat: 9.0 }, { lon: 38.90, lat: 9.0 }, { lon: 39.0, lat: 9.0 }];
  assert.equal(heatWeight(near), 0.5);
  assert.equal(heatWeight(far), 1);
});

test('buildHeatPoints gives every point the shared weight and follows the toggles', () => {
  const workers = Array.from({ length: 4 }, () => worker());
  const all = buildHeatPoints(workers, ALL_ON);
  assert.equal(all.length, 16);
  assert.ok(all.every((p) => p.weight === 0.5)); // 4 workers stacked on each stop
  const homeOnly = buildHeatPoints(workers, { home: true });
  assert.equal(homeOnly.length, 4);
  assert.ok(homeOnly.every((p) => p.layer === 'home'));
});
