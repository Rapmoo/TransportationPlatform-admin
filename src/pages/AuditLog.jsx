import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHead from '../components/common/PageHead';
import AuditLogTable, { ACTION_LABEL_KEYS } from '../components/audit/AuditLogTable';
import { fetchAuditLogs, AUDIT_ACTIONS } from '../api/audit';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

const PAGE_SIZE = 15;
const ACTIONS = ['all', ...AUDIT_ACTIONS];

export default function AuditLog() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // debounced copy of `query`
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAuditLogs(token, { page, pageSize: PAGE_SIZE, action: actionFilter, search });
      setRows(data.items);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.totalPages));
      setError('');
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err?.message || 'Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('audit.eyebrow')}
        title={t('audit.title')}
        description={t('audit.description', { shown: rows.length, total })}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--white)', border: '1px solid var(--slate-200)',
            borderRadius: 5, padding: '8px 12px', minWidth: 260, flex: '1 1 260px',
          }}
        >
          <Search size={14} color="var(--slate-500)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('audit.search_placeholder')}
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent' }}
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          style={{
            border: '1px solid var(--slate-200)', borderRadius: 5, padding: '8px 10px',
            fontSize: 13, background: 'var(--white)', color: 'var(--slate-700)',
          }}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a === 'all' ? t('audit.all_actions') : (ACTION_LABEL_KEYS[a] ? t(ACTION_LABEL_KEYS[a]) : a)}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="panel" role="alert" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--red-600, #B42318)' }}>{error}</span>
          <button className="btn btn-sm" onClick={load}>{t('data.retry')}</button>
        </div>
      )}

      <AuditLogTable rows={rows} loading={loading} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>{t('pagination.page_of', { page, total: totalPages })}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>{t('pagination.previous')}</button>
          <button className="btn btn-sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>{t('pagination.next')}</button>
        </div>
      </div>
    </div>
  );
}