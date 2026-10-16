import { useLocale } from '../../context/LocaleContext';
import { LAYER_DEFS } from './GISMap';
import { HEAT_GRADIENT_CSS } from './heatmapLayer';

const LAYER_LABEL_KEYS = {
  home: 'map.layer.home',
  start: 'map.layer.start',
  boarding: 'map.layer.boarding',
  after_work: 'map.layer.after_work',
};

export default function LayerControl({ visibleLayers, onToggle, baseMap, onBaseMap, className = '' }) {
  const { t } = useLocale();
  return (
    <div className={`panel${className ? ` ${className}` : ''}`}>
      <div className="panel-head">
        <h3>{t('map.layers_title')}</h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--slate-600)', marginBottom: 7 }}>{t('map.basemap_title')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['standard', 'satellite'].map((key) => (
              <button
                key={key}
                type="button"
                className={`btn btn-sm${baseMap === key ? ' btn-primary' : ''}`}
                onClick={() => onBaseMap(key)}
                style={{ justifyContent: 'center' }}
              >
                {t(`map.basemap.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', paddingTop: 4 }}>
          <input
            type="checkbox"
            checked={!!visibleLayers.heatmap}
            onChange={() => onToggle('heatmap')}
            style={{ accentColor: '#D73027', width: 14, height: 14 }}
          />
          <span style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: 'radial-gradient(circle, #D73027 0%, #FDAE61 42%, #FFFFBF 68%, #4575B4 100%)' }} />
          <span>{t('map.heatmap')}</span>
        </label>
        <div style={{ margin: '-2px 0 3px 24px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, color: 'var(--slate-500)' }}>
          <span>{t('map.density.low')}</span>
          <span aria-hidden="true" style={{ flex: 1, height: 6, minWidth: 32, borderRadius: 99, background: HEAT_GRADIENT_CSS }} />
          <span>{t('map.density.high')}</span>
        </div>

        {LAYER_DEFS.map((def) => (
          <label key={def.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!visibleLayers[def.key]}
              onChange={() => onToggle(def.key)}
              style={{ accentColor: def.color, width: 14, height: 14 }}
            />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: def.color, display: 'inline-block', flexShrink: 0 }} />
            {t(LAYER_LABEL_KEYS[def.key]) || def.label}
          </label>
        ))}
      </div>
      <div className="panel-head" style={{ borderTop: '1px solid var(--slate-100)', borderBottom: 'none' }}>
        <h3>{t('map.legend_title')}</h3>
      </div>
      <div className="panel-body" style={{ fontSize: 12, color: 'var(--slate-500)', lineHeight: 1.6 }}>
        {t('map.legend_text')}
        <div style={{ marginTop: 8 }}>{t('map.heatmap_note')}</div>
      </div>
    </div>
  );
}