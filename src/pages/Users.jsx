import { useCallback, useEffect, useState } from 'react';
import PageHead from '../components/common/PageHead';
import UsersTable from '../components/users/UsersTable';
import { createStaffUser, fetchUsers, setUserActive } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export default function Users() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [created, setCreated] = useState(null); // { username, temporary_password }

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setRows(await fetchUsers(token));
      setError('');
    } catch (err) {
      setRows([]);
      setError(err?.message || 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Returns an error message (shown inside the form) or '' on success.
  async function addUser(account) {
    try {
      const result = await createStaffUser(token, account);
      setCreated({ username: result.username, temporary_password: result.temporary_password });
      await load();
      return '';
    } catch (err) {
      return err?.message || 'Could not create the account.';
    }
  }

  async function toggleStatus(user) {
    setActionError('');
    try {
      await setUserActive(token, user.id, !user.is_active);
      await load();
    } catch (err) {
      setActionError(err?.message || 'Could not update the account.');
    }
  }

  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('users.eyebrow')}
        title={t('users.title')}
        description={t('users.description')}
      />

      {(error || actionError) && (
        <div className="panel" role="alert" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--red-600, #B42318)' }}>{error || actionError}</span>
          {error && <button className="btn btn-sm" onClick={load}>{t('data.retry')}</button>}
        </div>
      )}

      {created?.temporary_password && (
        <div className="panel" role="status" style={{ padding: '12px 14px', marginBottom: 14, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            {t('users.temp_password_notice', { username: created.username })}{' '}
            <strong className="mono">{created.temporary_password}</strong>
          </span>
          <button className="btn btn-sm" onClick={() => setCreated(null)}>{t('users.close')}</button>
        </div>
      )}

      <UsersTable rows={rows} loading={loading} onAdd={addUser} onToggleStatus={toggleStatus} />
    </div>
  );
}