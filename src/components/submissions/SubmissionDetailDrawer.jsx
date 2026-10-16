import { useMemo } from 'react';
import {
  X, MapPin, Building2, Bus, Calendar, Phone, Hash,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useLocale } from '../../context/LocaleContext';

const LOCATION_FIELDS = [
  { key: 'home', address: 'home_address', coords: 'home_coords', label: 'Home location' },
  { key: 'start', address: 'start_point_address', coords: 'start_point_coords', label: 'Starting transportation point' },
  { key: 'boarding', address: 'boarding_address', coords: 'boarding_coords', label: 'Boarding point' },
  { key: 'afterWork', address: 'after_work_bus_pickup_address', coords: 'after_work_bus_pickup_coords', label: 'After-work bus boarding point' },
];

export default function SubmissionDetailDrawer({ worker, onClose }) {
  const { t } = useLocale();
  const coordinateSummary = useMemo(() => LOCATION_FIELDS.map((location) => ({
    ...location,
    value: worker?.[location.coords],
  })), [worker]);

  if (!worker) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 39, 51, 0.35)',
        display: 'flex', justifyContent: 'flex-end', zIndex: 30,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520, maxWidth: '94vw', height: '100%', background: 'var(--white)',
          boxShadow: '-6px 0 18px rgba(15,39,51,0.12)', display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--teal-600)' }}>
              {worker.public_service_transport_id}
            </div>
            <h2 style={{ fontSize: 17, marginTop: 2 }}>{worker.employee_name}</h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} className="btn btn-sm" style={{ border: 'none', padding: 6 }} aria-label={t('submissions.drawer.close')}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge value="Submitted" />
            <StatusBadge value={worker.geocoding_status} />
          </div>

              <DetailRow icon={Hash} label={t('submissions.drawer.public_id')} value={worker.public_service_transport_id} mono />
              <DetailRow icon={Building2} label={t('submissions.drawer.organization')} value={worker.organization} />
              <DetailRow icon={Phone} label={t('submissions.drawer.phone_number')} value={worker.phone_number} mono />
              <DetailRow icon={Bus} label={t('submissions.drawer.bus_going')} value={worker.bus_number_going} />
              <DetailRow icon={Bus} label={t('submissions.drawer.bus_return')} value={worker.bus_number_return} />
              <DetailRow icon={Calendar} label={t('submissions.drawer.submitted')} value={worker.submission_datetime} mono />

          {coordinateSummary.map((location) => (
                <div key={location.key}>
                  <SectionLabel>{t(`submissions.drawer.${location.key}`)}</SectionLabel>
                  <AddressBlock
                    address={worker[location.address]}
                    coords={location.value}
                    noCoordsLabel={t('submissions.drawer.no_coords')}
                  />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon size={15} color="var(--slate-500)" />
      <div style={{ fontSize: 12, color: 'var(--slate-500)', width: 120, flexShrink: 0 }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 13, color: 'var(--ink-900)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>{children}</div>;
}

function AddressBlock({ address, coords, noCoordsLabel }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--slate-100)', borderRadius: 5, padding: '10px 12px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <MapPin size={14} color="var(--teal-600)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--ink-900)' }}>{address || '—'}</div>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: coords ? 'var(--slate-500)' : 'var(--red-600)', marginTop: 6, paddingLeft: 22 }}>
        {coords ? `X: ${Number(coords.lon).toFixed(5)} · Y: ${Number(coords.lat).toFixed(5)}` : noCoordsLabel}
      </div>
    </div>
  );
}