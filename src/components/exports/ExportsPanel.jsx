import { FileSpreadsheet, FileJson, FileText, ShieldCheck } from 'lucide-react';
import { useWorkerData } from '../../context/WorkerDataContext';
import { useLocale } from '../../context/LocaleContext';
import { useState } from 'react';
import { recordAudit } from '../../api/audit';

const FORMATS = [
  { key: 'csv', labelKey: 'exports.format.csv.label', descKey: 'exports.format.csv.desc', icon: FileText },
  { key: 'excel', labelKey: 'exports.format.excel.label', descKey: 'exports.format.excel.desc', icon: FileSpreadsheet },
  { key: 'geojson', labelKey: 'exports.format.geojson.label', descKey: 'exports.format.geojson.desc', icon: FileJson },
];

const EXCLUDED_FIELDS = ['employee_name', 'phone_number'];

const EXPORT_COLUMNS = [
  { key: 'id', en: 'Record ID', am: 'የመዝገብ መለያ' },
  { key: 'public_service_transport_id', en: 'Public Service Transport ID', am: 'የህዝብ አገልግሎት መጓጓዣ መለያ' },
  { key: 'reference_id', en: 'Reference ID', am: 'የማጣቀሻ መለያ' },
  { key: 'organization', en: 'Organization', am: 'ድርጅት' },
  { key: 'home_address', en: 'Home Address', am: 'የቤት አድራሻ' },
  { key: 'home_x', en: 'Home X Coordinate', am: 'የቤት X መጋጠሚያ' },
  { key: 'home_y', en: 'Home Y Coordinate', am: 'የቤት Y መጋጠሚያ' },
  { key: 'start_point_address', en: 'Starting Point Address', am: 'የመነሻ ቦታ አድራሻ' },
  { key: 'start_point_x', en: 'Starting Point X Coordinate', am: 'የመነሻ ቦታ X መጋጠሚያ' },
  { key: 'start_point_y', en: 'Starting Point Y Coordinate', am: 'የመነሻ ቦታ Y መጋጠሚያ' },
  { key: 'boarding_address', en: 'Boarding Point Address', am: 'የመሳፈሪያ ቦታ አድራሻ' },
  { key: 'boarding_x', en: 'Boarding Point X Coordinate', am: 'የመሳፈሪያ ቦታ X መጋጠሚያ' },
  { key: 'boarding_y', en: 'Boarding Point Y Coordinate', am: 'የመሳፈሪያ ቦታ Y መጋጠሚያ' },
  { key: 'after_work_bus_pickup_address', en: 'After-Work Bus Boarding Address', am: 'ከሥራ በኋላ የአውቶቡስ መሳፈሪያ ቦታ አድራሻ' },
  { key: 'after_work_x', en: 'After-Work X Coordinate', am: 'ከሥራ በኋላ X መጋጠሚያ' },
  { key: 'after_work_y', en: 'After-Work Y Coordinate', am: 'ከሥራ በኋላ Y መጋጠሚያ' },
  { key: 'bus_number_going', en: 'Going-to-Work Bus Number', am: 'ወደ ሥራ የሚሄድ አውቶቡስ ቁጥር' },
  { key: 'bus_number_return', en: 'Returning Bus Number', am: 'የመመለሻ አውቶቡስ ቁጥር' },
  { key: 'geocoding_status', en: 'Geocoding Status', am: 'የጂኦኮዲንግ ሁኔታ' },
  { key: 'submission_datetime', en: 'Submission Date and Time', am: 'የማስገቢያ ቀን እና ሰዓት' },
];

const LOCATION_LABELS = {
  home: { en: 'Home', am: 'ቤት' },
  start: { en: 'Starting Point', am: 'የመነሻ ቦታ' },
  boarding: { en: 'Boarding Point', am: 'የመሳፈሪያ ቦታ' },
  after_work: { en: 'After-Work Bus Boarding Point', am: 'ከሥራ በኋላ የአውቶቡስ መሳፈሪያ ቦታ' },
};

const STATUS_LABELS = {
  success: { en: 'Geocoded', am: 'ተጂኦኮድ ተደርጓል' },
  pending: { en: 'Pending', am: 'በመጠባበቅ ላይ' },
  failed: { en: 'Failed', am: 'አልተሳካም' },
};

function exportRows(workers) {
  return workers.map((worker) => ({
    id: worker.id,
    public_service_transport_id: worker.public_service_transport_id,
    reference_id: worker.reference_id,
    organization: worker.organization,
    home_address: worker.home_address,
    home_x: worker.home_coords?.lon ?? '',
    home_y: worker.home_coords?.lat ?? '',
    start_point_address: worker.start_point_address,
    start_point_x: worker.start_point_coords?.lon ?? '',
    start_point_y: worker.start_point_coords?.lat ?? '',
    boarding_address: worker.boarding_address,
    boarding_x: worker.boarding_coords?.lon ?? '',
    boarding_y: worker.boarding_coords?.lat ?? '',
    after_work_bus_pickup_address: worker.after_work_bus_pickup_address,
    after_work_x: worker.after_work_bus_pickup_coords?.lon ?? '',
    after_work_y: worker.after_work_bus_pickup_coords?.lat ?? '',
    bus_number_going: worker.bus_number_going,
    bus_number_return: worker.bus_number_return,
    geocoding_status: worker.geocoding_status,
    submission_datetime: worker.submission_datetime,
  }));
}

const EXPORT_BASENAME = 'WORKERS TRANSPORT DATA';

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('\"', '\"\"')}"` : text;
}

function translatedHeaders(language) {
  return EXPORT_COLUMNS.map((column) => column[language]);
}

function exportCsv(rows, language) {
  const headers = translatedHeaders(language);
  const keys = EXPORT_COLUMNS.map((column) => column.key);
  const lines = [headers.map(csvValue).join(','), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(','))];
  downloadBlob(`\uFEFF${lines.join('\n')}`, `${EXPORT_BASENAME}.csv`, 'text/csv;charset=utf-8');
}

function exportExcel(rows, language) {
  const headers = translatedHeaders(language);
  const keys = EXPORT_COLUMNS.map((column) => column.key);
  const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const table = `<table border="1"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${keys.map((key) => `<td>${esc(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  downloadBlob(`<!doctype html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`, `${EXPORT_BASENAME}.xls`, 'application/vnd.ms-excel');
}

function exportGeoJson(workers, language) {
  const features = [];
  const label = (map, key) => map[key]?.[language] ?? key;
  workers.forEach((worker) => {
    [
      ['home', worker.home_coords, worker.home_address],
      ['start', worker.start_point_coords, worker.start_point_address],
      ['boarding', worker.boarding_coords, worker.boarding_address],
      ['after_work', worker.after_work_bus_pickup_coords, worker.after_work_bus_pickup_address],
    ].forEach(([locationType, coords, address]) => {
      if (!coords) return;
      const properties = {};
      const add = (field, value) => {
        const column = EXPORT_COLUMNS.find((item) => item.key === field);
        properties[column?.[language] ?? field] = value;
      };
      add('public_service_transport_id', worker.public_service_transport_id);
      add('id', worker.id);
      add('reference_id', worker.reference_id);
      add('organization', worker.organization);
      add('bus_number_going', worker.bus_number_going);
      add('bus_number_return', worker.bus_number_return);
      add('geocoding_status', label(STATUS_LABELS, worker.geocoding_status));
      add('submission_datetime', worker.submission_datetime);
      properties[language === 'am' ? 'የቦታ አይነት' : 'Location Type'] = label(LOCATION_LABELS, locationType);
      properties[language === 'am' ? 'አድራሻ' : 'Address'] = address;
      properties[language === 'am' ? 'X መጋጠሚያ' : 'X Coordinate'] = coords.lon;
      properties[language === 'am' ? 'Y መጋጠሚያ' : 'Y Coordinate'] = coords.lat;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coords.lon, coords.lat] },
        properties,
      });
    });
  });
  downloadBlob(JSON.stringify({ type: 'FeatureCollection', features }, null, 2), `${EXPORT_BASENAME}.geojson`, 'application/geo+json;charset=utf-8');
}

export default function ExportsPanel() {
  const { workers } = useWorkerData();
  const { t, locale } = useLocale();
  const [exportLanguage, setExportLanguage] = useState(locale);
  const rows = exportRows(workers);
  const excluded = t('exports.excluded_fields');

  function runExport(format) {
    const label = { csv: 'CSV', excel: 'Excel', geojson: 'GeoJSON' }[format] || format;
    recordAudit('DATA_EXPORT', `${label} export · ${rows.length} records`);
    if (format === 'csv') exportCsv(rows, exportLanguage);
    if (format === 'excel') exportExcel(rows, exportLanguage);
    if (format === 'geojson') exportGeoJson(workers, exportLanguage);
  }

  return (
    <div>
      <div className="export-privacy-note">
        <ShieldCheck size={17} />
        <div><strong>{t('exports.privacy_title')}</strong><div>{t('exports.privacy_note', { fields: excluded })}</div></div>
      </div>

      <div className="panel" style={{ padding: 18, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{t('exports.language_title')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginTop: 4, lineHeight: 1.5 }}>{t('exports.language_description')}</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-900)' }}>
          <span>{t('exports.language_label')}</span>
          <select
            className="form-control"
            value={exportLanguage}
            onChange={(event) => setExportLanguage(event.target.value)}
            style={{ minWidth: 160 }}
            aria-label={t('exports.language_label')}
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>
        </label>
      </div>

      <div className="exports-grid">
        {FORMATS.map((f) => (
          <div className="panel" key={f.key} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><f.icon size={16} color="var(--teal-600)" /></div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{t(f.labelKey)}</div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--slate-500)', margin: 0, lineHeight: 1.5 }}>{t(f.descKey)}</p>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>{t('exports.records_note', { count: workers.length })}</div>
            <button className="btn btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => runExport(f.key)}>
              {t('exports.export_button', { format: t(f.labelKey) })}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}