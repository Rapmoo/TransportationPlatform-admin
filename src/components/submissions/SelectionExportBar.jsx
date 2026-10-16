import { FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

const FORMATS = [
  { key: 'csv', label: 'CSV', icon: FileText },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { key: 'geojson', label: 'GeoJSON', icon: FileJson },
];

// Shown above the table once at least one record is ticked.
export default function SelectionExportBar({ count, pendingFormat, error, onExport, onClear }) {
  const { t } = useLocale();
  if (count === 0 && !error) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      {count > 0 && (
        <div
          className="panel"
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
            {t('submissions.export.selected', { count })}
          </span>
          <button className="btn btn-sm" onClick={onClear} disabled={pendingFormat !== null}>
            {t('submissions.export.clear')}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--slate-500)' }}>
            {t('submissions.export.label')}
          </span>
          {FORMATS.map((f) => (
            <button
              key={f.key}
              className="btn btn-primary btn-sm"
              disabled={pendingFormat !== null}
              onClick={() => onExport(f.key)}
            >
              {pendingFormat === f.key
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <f.icon size={13} />}
              {' '}{f.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div role="alert" style={{ fontSize: 12.5, color: 'var(--red-600, #B42318)', marginTop: 8 }}>
          {t('submissions.export.error', { message: error })}
        </div>
      )}
    </div>
  );
}