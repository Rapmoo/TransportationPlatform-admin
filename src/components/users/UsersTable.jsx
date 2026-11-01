import { useState } from 'react';
import { UserPlus, Power, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { formatUtc } from '../../utils/formatTime';
import {
  PASSWORD_MIN_LENGTH, passwordChecks, isStrongPassword, sanitizeFullName, isValidFullName,
} from '../../utils/accountRules';

const ROLE_OPTIONS = ['SUPERVISOR', 'ADMIN']; // backend role names
const EMPTY_FORM = { name: '', username: '', password: '', role: 'SUPERVISOR' };

export default function UsersTable({ rows, loading = false, onAdd, onToggleStatus }) {
  const { t } = useLocale();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const checks = passwordChecks(form.password);
  const roleLabel = (role) => (role === 'ADMIN' ? t('login.role.superadmin') : role === 'SUPERVISOR' ? t('login.role.supervisor') : role);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError(t('users.form.required_error'));
      return;
    }
    if (!isValidFullName(form.name)) {
      setNameError(t('users.form.name_letters_only'));
      return;
    }
    if (!isStrongPassword(form.password)) {
      setPasswordTouched(true);
      setFormError(t('users.form.password_weak'));
      return;
    }
    setSaving(true);
    setFormError('');
    const message = await onAdd({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      role: form.role,
    });
    setSaving(false);
    if (message) { setFormError(message); return; }
    setForm(EMPTY_FORM);
    setNameError('');
    setPasswordTouched(false);
    setShowAdd(false);
  }

  function changeName(e) {
    const raw = e.target.value;
    const clean = sanitizeFullName(raw);
    setForm({ ...form, name: clean });
    setNameError(clean !== raw ? t('users.form.name_letters_only') : '');
  }

  const passwordMessage = () => {
    if (!form.password) return '';
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      return t('users.password.too_short', { count: form.password.length, min: PASSWORD_MIN_LENGTH });
    }
    const missing = checks.filter((c) => !c.ok).map((c) => t(`users.password.need_${c.key}`));
    return missing.length ? t('users.password.add', { items: missing.join(', ') }) : t('users.password.strong');
  };

  return (
    <div>
      <div className="users-toolbar">
        <div>
          <div className="users-toolbar-title">{t('users.control_title')}</div>
          <div className="users-toolbar-sub">{t('users.control_description')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> {t('users.add_account')}
        </button>
      </div>

      <div className="panel">
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>{t('users.table.name')}</th>
                <th>{t('users.table.username')}</th>
                <th>{t('users.table.role')}</th>
                <th>{t('users.table.status')}</th>
                <th>{t('users.table.created')}</th>
                <th style={{ textAlign: 'right' }}>{t('users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td className="mono" style={{ color: 'var(--slate-500)' }}>{u.username}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>
                    <span className={`account-status ${u.is_active ? 'is-active' : 'is-disabled'}`}>
                      {u.is_active ? t('users.status.active') : t('users.status.disabled')}
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--slate-500)' }}>{formatUtc(u.created_at) || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm"
                        title={u.is_active ? t('users.disable_account') : t('users.enable_account')}
                        onClick={() => onToggleStatus(u)}
                      >
                        <Power size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '32px 0' }}>
                    {loading ? t('data.loading') : t('users.table.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{t('users.add_account')}</h2>
                <p>{t('users.add_account_description')}</p>
              </div>
              <button className="btn btn-sm" onClick={() => { setShowAdd(false); setNameError(''); setPasswordTouched(false); }} aria-label={t('users.close')}><X size={15} /></button>
            </div>
            <form onSubmit={submit} className="account-form" noValidate>
              <label>
                <span>{t('users.form.name')}</span>
                <input value={form.name} onChange={changeName} autoComplete="off" required />
                {nameError && <small role="alert" style={{ color: 'var(--red-600, #B42318)', fontSize: 12 }}>{nameError}</small>}
              </label>
              <label><span>{t('users.form.username')}</span><input required minLength={3} autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
              <label>
                <span>{t('users.form.password')}</span>
                <input type="password" required autoComplete="new-password" value={form.password} onChange={(e) => { setPasswordTouched(true); setForm({ ...form, password: e.target.value }); }} />
              </label>
              {passwordTouched && form.password && (
                <div aria-live="polite" style={{ fontSize: 12, marginTop: -6 }}>
                  <div style={{ color: isStrongPassword(form.password) ? 'var(--green-600, #067647)' : 'var(--red-600, #B42318)', fontWeight: 500 }}>
                    {passwordMessage()}
                  </div>
                  <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
                    {checks.map((c) => (
                      <li key={c.key} style={{ color: c.ok ? 'var(--green-600, #067647)' : 'var(--slate-500)' }}>
                        {c.ok ? '✓' : '○'} {t(`users.password.rule_${c.key}`, { min: PASSWORD_MIN_LENGTH })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <label><span>{t('users.form.role')}</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLE_OPTIONS.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
              {formError && <div role="alert" style={{ color: 'var(--red-600, #B42318)', fontSize: 13 }}>{formError}</div>}
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => { setShowAdd(false); setNameError(''); setPasswordTouched(false); }}>{t('users.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}><UserPlus size={14} /> {t('users.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}