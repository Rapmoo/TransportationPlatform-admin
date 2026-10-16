import { Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useLocale } from '../../context/LocaleContext';

export default function SubmissionsTable({ rows, onView }) {
  const { t } = useLocale();
  return (
    <div className="panel">
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>{t('submissions.table.public_id')}</th>
              <th>{t('submissions.table.employee_name')}</th>
              <th>{t('submissions.table.organization')}</th>
              <th>{t('submissions.table.bus_going')}</th>
              <th>{t('submissions.table.bus_return')}</th>
              <th>{t('submissions.table.phone_number')}</th>
              <th>{t('submissions.table.home_address')}</th>
              <th>{t('submissions.table.start_point')}</th>
              <th>{t('submissions.table.boarding_address')}</th>
              <th>{t('submissions.table.after_work_pickup')}</th>
              <th>{t('submissions.table.geocoding')}</th>
              <th>{t('submissions.table.submitted')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="mono" style={{ color: 'var(--slate-500)' }}>{w.public_service_transport_id}</td>
                <td style={{ fontWeight: 500 }}>{w.employee_name}</td>
                <td style={{ maxWidth: 170 }}>{w.organization}</td>
                <td className="mono">{w.bus_number_going}</td>
                <td className="mono">{w.bus_number_return}</td>
                <td className="mono">{w.phone_number}</td>
                <td style={{ maxWidth: 200 }}>{w.home_address}</td>
                <td style={{ maxWidth: 200 }}>{w.start_point_address}</td>
                <td style={{ maxWidth: 180 }}>{w.boarding_address}</td>
                <td style={{ maxWidth: 200 }}>{w.after_work_bus_pickup_address}</td>
                <td><StatusBadge value={w.geocoding_status} /></td>
                <td className="mono" style={{ color: 'var(--slate-500)' }}>{w.submission_datetime}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => onView(w)}>
                    <Eye size={13} /> {t('submissions.table.view')}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '32px 0' }}>
                  {t('submissions.table.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}