import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import FullScreen from 'ol/control/FullScreen';
import { useLocale } from '../../context/LocaleContext';
import { useWorkerData } from '../../context/WorkerDataContext';
import { LAYER_DEFS } from './layerDefs';
import { buildHeatPoints, readCoord } from './heatmapData';

export { LAYER_DEFS };

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const BASEMAPS = {
  standard: {
    url: import.meta.env.VITE_STANDARD_MAP_TILE_URL || 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  satellite: {
    url: import.meta.env.VITE_SATELLITE_MAP_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
};

function makeHeatmapLayer() {
  const layer = new Heatmap({
    source: new VectorSource(),
    blur: 24,
    radius: 16,
    gradient: ['#313695', '#4575B4', '#74ADD1', '#ABD9E9', '#FFFFBF', '#FEE090', '#FDAE61', '#F46D43', '#D73027', '#A50026'],
  });
  layer.set('isHeatmap', true);
  layer.setZIndex(1);
  return layer;
}

// The heatmap follows the four location layers: only the location types that
// are ticked contribute to the density, each valid point once.
function refreshHeatmap(heatmapLayer, workers, visible) {
  const features = buildHeatPoints(workers, visible).map(({ lon, lat, weight }) => (
    new Feature({ geometry: new Point(fromLonLat([lon, lat])), weight })
  ));
  const source = heatmapLayer.getSource();
  source.clear(true);
  source.addFeatures(features);
}

function applyVisibility(layers, heatmapLayer, workers, visible) {
  Object.entries(layers).forEach(([key, layer]) => layer.setVisible(!!visible[key]));
  if (!heatmapLayer) return;
  refreshHeatmap(heatmapLayer, workers, visible);
  heatmapLayer.setVisible(!!visible.heatmap);
}

function makeLayer(def, workers) {
  const features = workers
    .filter((w) => readCoord(w[def.field]))
    .map((w) => {
      const coords = readCoord(w[def.field]);
      const f = new Feature({ geometry: new Point(fromLonLat([coords.lon, coords.lat])) });
      f.set('name', w.employee_name);
      f.set('public_id', w.public_service_transport_id);
      f.set('bus_going', w.bus_number_going);
      f.set('bus_return', w.bus_number_return);
      f.set('address', w[def.addr]);
      f.set('lon', coords.lon);
      f.set('lat', coords.lat);
      f.set('layer', def.key);
      return f;
    });

  const layer = new VectorLayer({
    source: new VectorSource({ features }),
    style: new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: def.color }),
        stroke: new Stroke({ color: '#fff', width: 1.5 }),
      }),
    }),
  });
  layer.set('key', def.key);
  return layer;
}

export default function GISMap({ visibleLayers, baseMap }) {
  const { workers } = useWorkerData();
  const { t } = useLocale();
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const popupRef = useRef(null);
  const layersRef = useRef({});
  const mapObjRef = useRef(null);
  const baseLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const visibleRef = useRef(visibleLayers);

  // Declared before the map-building effect so a rebuilt map (new data or a
  // language switch) always starts with the latest layer visibility.  useEffect(() => { visibleRef.current = visibleLayers; });

  useEffect(() => {
    const layers = {};
    LAYER_DEFS.forEach((def) => { layers[def.key] = makeLayer(def, workers); });
    layersRef.current = layers;
    Object.values(layers).forEach((layer, index) => layer.setZIndex(index + 2));
    const heatmapLayer = makeHeatmapLayer();
    heatmapLayerRef.current = heatmapLayer;
    applyVisibility(layers, heatmapLayer, workers, visibleRef.current);

    const baseConfig = BASEMAPS[baseMapRef.current] || BASEMAPS.standard;
    const base = new TileLayer({
      source: new XYZ({ url: baseConfig.url, attributions: baseConfig.attribution, crossOrigin: 'anonymous' }),
    });
    baseLayerRef.current = base;

    const overlay = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      offset: [0, -10],
      stopEvent: false,
    });
    overlayRef.current = overlay;

    const map = new Map({
      target: mapRef.current,
      layers: [base, heatmapLayer, ...Object.values(layers)],
      overlays: [overlay],
      view: new View({ center: fromLonLat([38.7525, 9.0192]), zoom: 11 }),
    });

    // Fullscreen is available to both Superadmin and Supervisor because both roles
    // can access this GIS page. The control fullscreen-es the whole map container,
    // including the map and its popup, rather than only the inner map canvas.
    map.addControl(new FullScreen({
      tipLabel: t('map.fullscreen'),
      source: mapRef.current?.parentElement || mapRef.current,
    }));

    mapObjRef.current = map;

    map.on('pointermove', (evt) => {
      // Only the regular point layers carry a `layer` property; ignore the
      // heatmap's source features so its glow cannot trigger an empty popup.
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (f) => (f.get('layer') ? f : undefined),
        { layerFilter: (layer) => !layer.get('isHeatmap') },
      );
      const target = map.getTarget();
      if (target && target.style) target.style.cursor = feature ? 'pointer' : '';
      if (feature) {
        const lon = Number(feature.get('lon'));
        const lat = Number(feature.get('lat'));
        popupRef.current.innerHTML = `
          <div style="font-weight:600;font-size:12.5px;color:var(--ink-900);">${escapeHtml(feature.get('name'))}</div>
          <div style="font-size:11px;color:var(--slate-500);margin-top:3px;">Public ID: ${escapeHtml(feature.get('public_id'))}</div>
          <div style="font-size:11.5px;color:var(--slate-500);margin-top:2px;">${escapeHtml(feature.get('address'))}</div>
          <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--slate-600);margin-top:5px;">X: ${lon.toFixed(5)} · Y: ${lat.toFixed(5)}</div>
          <div style="font-size:10.5px;color:var(--slate-600);margin-top:2px;">Bus → ${escapeHtml(feature.get('bus_going'))} · ← ${escapeHtml(feature.get('bus_return'))}</div>
        `;
        overlay.setPosition(evt.coordinate);
      } else {
        overlay.setPosition(undefined);
      }
    });

    return () => {
      map.setTarget(null);
      // map.dispose() leaves layers alone; the heatmap owns a WebGL context
      // that must be released here or rebuilt maps pile up until the browser
      // starts dropping contexts ("Too many active WebGL contexts").
      [base, heatmapLayer, ...Object.values(layers)].forEach((layer) => layer.dispose());
      map.dispose();
      if (mapObjRef.current === map) mapObjRef.current = null;
      if (heatmapLayerRef.current === heatmapLayer) heatmapLayerRef.current = null;
    };
  }, [workers, t]);

  useEffect(() => {
    if (!baseLayerRef.current) return;
    const config = BASEMAPS[baseMap] || BASEMAPS.standard;
    baseLayerRef.current.setSource(new XYZ({ url: config.url, attributions: config.attribution, crossOrigin: 'anonymous' }));
  }, [baseMap]);

  useEffect(() => {
    applyVisibility(layersRef.current, heatmapLayerRef.current, workers, visibleLayers);
  }, [visibleLayers, workers]);

  return (
    <div className="gis-map-shell" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div
        ref={popupRef}
        style={{
          position: 'absolute', background: 'var(--white)', padding: '7px 10px',
          borderRadius: 5, border: '1px solid var(--slate-200)', boxShadow: '0 3px 10px rgba(15,39,51,0.12)',
          pointerEvents: 'none', minWidth: 180,
        }}
      />
    </div>
  );
}