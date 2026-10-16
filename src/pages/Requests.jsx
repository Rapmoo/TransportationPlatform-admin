import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';
import PageHead from '../components/common/PageHead';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import {
  fetchCorrectionRequests, approveCorrectionRequest, rejectCorrectionRequest,
} from '../api/requests';

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];
const STATUS_CLASS = { PENDING: 'status-pending', APPROVED: 'status-success', REJECTED: 'status-failed' };
const POLL_MS = 30000;

function humanize(key) {
  return String(key || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return value || '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Requests() {
  const { t } = useLocale();
  const { token } = useAuth();
  const fieldLabel = (key) => {
    if (!key) return '—';
    const translated = t(`requests.field.${key}`);
    return translated === `requests.field.${key}` ? humanize(key) : translated;
  };
  const [tab, setTab] = useState('PENDING');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState(null); // { request, action }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      setRows(await fetchCorrectionRequests(token, tab));
      setError('');
    } catch (err) {
      if (!silent) setRows([]);
      setError(err?.message || 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { load(); }, [load]);

  // New worker requests show up without a manual refresh.
  useEffect(() => {
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  function openDecision(request, action) {
    setDeciding({ request, action });
    setNote('');
    setActionError('');
  }

  async function confirmDecision() {
    if (!deciding) return;
    setBusy(true);
    setActionError('');
    try {
      const fn = deciding.action === 'approve' ? approveCorrectionRequest : rejectCorrectionRequest;
      await fn(token, deciding.request.id, note.trim());
      setDeciding(null);
      await load(true);
    } catch (err) {
      setActionError(err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('requests.eyebrow')}
        title={t('requests.title')}
        description={t('requests.description')}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm${tab === key ? ' btn-primary' : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`requests.tab.${key.toLowerCase()}`)}
          </button>
        ))}
        <button type="button" className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => load()}>
          <RefreshCw size={13} /> {t('requests.refresh')}
        </button>
      </div>

      {error && (
        <div className="panel" role="alert" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--red-600)' }}>
          {t('requests.error', { message: error })}
        </div>
      )}

      <div className="panel">
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>{t('requests.table.date')}</th>
                <th>{t('requests.table.worker')}</th>
                <th>{t('requests.table.submission')}</th>
                <th>{t('requests.table.field')}</th>
                <th>{t('requests.table.current')}</th>
                <th>{t('requests.table.requested')}</th>
                <th>{t('requests.table.reason')}</th>
                <th>{t('requests.table.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono" style={{ color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.employee_name || '—'}</div>
                    {r.employee_id && <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>{r.employee_id}</div>}
                  </td>
                  <td className="mono">{r.submission_number || '—'}</td>
                  <td>{fieldLabel(r.field)}</td>
                  <td style={{ maxWidth: 200 }}>{r.current_value || '—'}</td>
                  <td style={{ maxWidth: 220, fontWeight: 500 }}>{r.requested_value || '—'}</td>
                  <td style={{ maxWidth: 240 }}>
                    {r.reason || '—'}
                    {r.admin_note && (
                      <div style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 4 }}>
                        {t('requests.admin_note')}: {r.admin_note}
                      </div>
                    )}
                  </td>
                  <td><span className={`status ${STATUS_CLASS[r.status] || 'status-neutral'}`}>{t(`requests.status.${r.status.toLowerCase()}`)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => openDecision(r, 'approve')}>
                          <Check size={13} /> {t('requests.approve')}
                        </button>
                        <button className="btn btn-sm" onClick={() => openDecision(r, 'reject')}>
                          <X size={13} /> {t('requests.reject')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '32px 0' }}>
                    {t('requests.empty')}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '32px 0' }}>
                    {t('data.loading')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deciding && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,39,51,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}
        >
          <div className="panel" style={{ width: 440, maxWidth: '100%', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {t(deciding.action === 'approve' ? 'requests.confirm_approve' : 'requests.confirm_reject')}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate-500)', margin: '8px 0 12px' }}>
              {deciding.request.employee_name}
              {deciding.request.submission_number ? ` · ${deciding.request.submission_number}` : ''}
              {deciding.request.field ? ` — ${fieldLabel(deciding.request.field)}: ${deciding.request.requested_value}` : ''}
              {!deciding.request.field && deciding.request.reason ? ` — ${deciding.request.reason}` : ''}
            </p>
            <label style={{ fontSize: 12.5, fontWeight: 600 }}>{t('requests.note_label')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ width: '100%', marginTop: 6, padding: 8, border: '1px solid var(--slate-200)', borderRadius: 5, fontSize: 13, background: 'var(--white)', color: 'var(--slate-700)', fontFamily: 'inherit' }}
            />
            {actionError && <div role="alert" style={{ color: 'var(--red-600)', fontSize: 12.5, marginTop: 8 }}>{actionError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn btn-sm" onClick={() => setDeciding(null)} disabled={busy}>{t('requests.cancel')}</button>
              <button className="btn btn-sm btn-primary" onClick={confirmDecision} disabled={busy}>
                {t(deciding.action === 'approve' ? 'requests.approve' : 'requests.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}