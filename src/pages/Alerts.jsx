import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, ExternalLink, Trash2 } from 'lucide-react';
import PageHead from '../components/common/PageHead';
import DataStatus from '../components/common/DataStatus';
import useAlerts from '../hooks/useAlerts';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import useSeenAlerts from '../hooks/useSeenAlerts';
import useDismissedAlerts from '../hooks/useDismissedAlerts';

export default function Alerts() {
  const { t } = useLocale();
  const alerts = useAlerts();
  const { user, token } = useAuth();
  const { markSeen } = useSeenAlerts(user?.id);
  const { dismiss } = useDismissedAlerts(token);
  const [selected, setSelected] = useState([]); // public IDs of ticked alerts
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Drop selections for alerts that no longer exist.
  useEffect(() => {
    setSelected((current) => current.filter((id) => alerts.some((a) => a.publicId === id)));
  }, [alerts]);

  const allSelected = alerts.length > 0 && selected.length === alerts.length;

  function toggle(publicId) {
    setConfirming(false);
    setSelected((current) => (current.includes(publicId) ? current.filter((id) => id !== publicId) : [...current, publicId]));
  }

  function toggleAll() {
    setConfirming(false);
    setSelected(allSelected ? [] : alerts.map((a) => a.publicId));
  }

  async function deleteSelected() {
    setBusy(true);
    setError('');
    try {
      await dismiss(selected);
      setSelected([]);
      setConfirming(false);
    } catch (err) {
      setError(err?.message || t('alerts.delete_error'));
    } finally {
      setBusy(false);
    }
  }

  // Opening the page counts as reading the alerts: clear the sidebar badge.
  useEffect(() => {
    if (alerts.length) markSeen(alerts);
  }, [alerts, markSeen]);

  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('alerts.eyebrow')}
        title={t('alerts.title')}
        description={t('alerts.description', { count: alerts.length })}
      />

      <DataStatus />

      {alerts.length > 0 && (
        <div className="panel" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            {t('alerts.select_all')}
          </label>
          <span style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>{t('alerts.selected_count', { count: selected.length })}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {confirming ? (
              <>
                <span style={{ fontSize: 13 }}>{t('alerts.confirm_delete', { count: selected.length })}</span>
                <button className="btn btn-sm" onClick={() => setConfirming(false)} disabled={busy}>{t('users.cancel')}</button>
                <button className="btn btn-sm btn-primary" onClick={deleteSelected} disabled={busy}>
                  <Trash2 size={13} /> {t('alerts.delete_confirm_button')}
                </button>
              </>
            ) : (
              <button className="btn btn-sm btn-danger-ghost" disabled={selected.length === 0} onClick={() => setConfirming(true)}>
                <Trash2 size={13} /> {t('alerts.delete_selected')}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="panel" role="alert" style={{ padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--red-600, #B42318)' }}>
          {error}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="panel" style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>
          {t('alerts.empty')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map((alert) => (
          <div key={alert.id} className="panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                aria-label={t('alerts.select_alert', { id: alert.publicId })}
                checked={selected.includes(alert.publicId)}
                onChange={() => toggle(alert.publicId)}
                style={{ marginTop: 4, flexShrink: 0 }}
              />
              <TriangleAlert size={18} color="var(--amber-600)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t('alerts.duplicate.title')}</div>
                <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginTop: 3 }}>
                  <span className="mono">{alert.publicId}</span> · {t('dashboard.duplicates.records', { count: alert.records.length })}
                </div>
              </div>
              <Link
                className="btn btn-sm"
                to={`/submissions?q=${encodeURIComponent(alert.publicId)}`}
              >
                <ExternalLink size={13} /> {t('alerts.view_records')}
              </Link>
            </div>

            <div className="scroll-x" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('submissions.table.employee_name')}</th>
                    <th>{t('submissions.table.organization')}</th>
                    <th>{t('submissions.table.phone_number')}</th>
                    <th>{t('submissions.table.submitted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {alert.records.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 500 }}>{w.employee_name}</td>
                      <td>{w.organization}</td>
                      <td className="mono">{w.phone_number}</td>
                      <td className="mono" style={{ color: 'var(--slate-500)' }}>{w.submission_datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}