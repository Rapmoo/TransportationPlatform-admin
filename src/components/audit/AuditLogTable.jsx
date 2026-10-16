import { useLocale } from '../../context/LocaleContext';

const ACTION_STYLES = {
  LOGIN: 'status-success',
  LOGOUT: 'status-neutral',
  RECORD_VIEW: 'status-neutral',
  MAP_VIEW: 'status-neutral',
  CHANGE_REQUEST_APPROVED: 'status-success',
  CHANGE_REQUEST_REJECTED: 'status-failed',
  CHANGE_REQUEST_EXPIRED: 'status-neutral',
};

export const ACTION_LABEL_KEYS = {
  LOGIN: 'audit.action.login',
  LOGOUT: 'audit.action.logout',
  RECORD_VIEW: 'audit.action.record_view',
  MAP_VIEW: 'audit.action.map_view',
  DATA_EXPORT: 'audit.action.data_export',
  USER_CREATED: 'audit.action.user_created',
  USER_STATUS_CHANGE: 'audit.action.user_status_change',
  USER_CREDENTIALS_CHANGE: 'audit.action.user_credentials_change',
  ADMIN_EDIT: 'audit.action.admin_edit',
  STAFF_STATUS_CHANGE: 'audit.action.staff_status_change',
  WORKER_SUBMIT: 'audit.action.worker_submit',
  WORKER_RESUBMIT: 'audit.action.worker_resubmit',
  WORKER_CHANGE_REQUEST: 'audit.action.worker_change_request',
  CHANGE_REQUEST_APPROVED: 'audit.action.change_request_approved',
  CHANGE_REQUEST_REJECTED: 'audit.action.change_request_rejected',
  CHANGE_REQUEST_COMPLETED: 'audit.action.change_request_completed',
  CHANGE_REQUEST_EXPIRED: 'audit.action.change_request_expired',
  DUPLICATE_EMPLOYEE_ID_DETECTED: 'audit.action.duplicate_employee_id_detected',
  DUPLICATE_ACKNOWLEDGED: 'audit.action.duplicate_acknowledged',
  DUPLICATE_ALERT_DELETED: 'audit.action.duplicate_alert_deleted',
};

export default function AuditLogTable({ rows, loading = false }) {
  const { t } = useLocale();
  return (
    <div className="panel">
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>{t('audit.table.datetime')}</th>
              <th>{t('audit.table.user')}</th>
              <th>{t('audit.table.role')}</th>
              <th>{t('audit.table.action')}</th>
              <th>{t('audit.table.record')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id}>
                <td className="mono" style={{ color: 'var(--slate-500)' }}>{entry.datetime}</td>
                <td style={{ fontWeight: 500 }}>{entry.user || '—'}</td>
                <td>{!entry.role ? '—' : entry.role === 'Superadmin' ? t('login.role.superadmin') : entry.role === 'Supervisor' ? t('login.role.supervisor') : entry.role}</td>
                <td>
                  <span className={`status ${ACTION_STYLES[entry.action] || 'status-neutral'}`}>
                    {ACTION_LABEL_KEYS[entry.action] ? t(ACTION_LABEL_KEYS[entry.action]) : entry.action}
                  </span>
                </td>
                <td style={{ color: 'var(--slate-700)', wordBreak: 'break-word' }}>{entry.detail || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '32px 0' }}>
                  {loading ? t('data.loading') : t('audit.table.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}