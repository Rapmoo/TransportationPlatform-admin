import { useEffect, useState } from 'react';
import PageHead from '../components/common/PageHead';
import GISMap from '../components/map/GISMap';
import LayerControl from '../components/map/LayerControl';
import { useLocale } from '../context/LocaleContext';
import DataStatus from '../components/common/DataStatus';
import { recordAudit } from '../api/audit';

export default function GISMapPage() {
  const { t } = useLocale();
  const [visibleLayers, setVisibleLayers] = useState({ heatmap: true, home: false, start: false, boarding: false, after_work: false });
  const [baseMap, setBaseMap] = useState('standard');

  useEffect(() => { recordAudit('MAP_VIEW', 'GIS map'); }, []);

  function toggle(key) {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="page-body map-page-body">
      <PageHead
        eyebrow={t('map.eyebrow')}
        title={t('map.title')}
        description={t('map.description')}
      />

      <DataStatus />

      <div className="map-layout">
        <LayerControl visibleLayers={visibleLayers} onToggle={toggle} baseMap={baseMap} onBaseMap={setBaseMap} className="layer-control-panel" />
        <div className="panel map-panel">
          <GISMap visibleLayers={visibleLayers} baseMap={baseMap} />
        </div>
      </div>
    </div>
  );
}