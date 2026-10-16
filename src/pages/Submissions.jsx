import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHead from '../components/common/PageHead';
import FiltersBar from '../components/submissions/FiltersBar';
import SubmissionsTable from '../components/submissions/SubmissionsTable';
import SubmissionDetailDrawer from '../components/submissions/SubmissionDetailDrawer';
import { useWorkerData } from '../context/WorkerDataContext';
import DataStatus from '../components/common/DataStatus';
import { useLocale } from '../context/LocaleContext';
import { recordAudit } from '../api/audit';

const PAGE_SIZE = 12;

export default function Submissions() {
  const { t } = useLocale();
  const { workers } = useWorkerData();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [busFilter, setBusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const organizations = useMemo(() => Array.from(new Set(workers.map((w) => w.organization))).sort(), [workers]);
  const buses = useMemo(() => Array.from(new Set(
    workers.flatMap((w) => [w.bus_number_going, w.bus_number_return])
      .map((b) => String(b ?? '').trim())
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [workers]);
  const selected = workers.find((worker) => worker.id === selectedId) || null;

  // Opening a record's detail drawer is an audited "view".
  useEffect(() => {
    if (selected) recordAudit('RECORD_VIEW', selected.public_service_transport_id || String(selected.id));
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workers.filter((w) => {
      const haystack = [
        w.employee_name,
        w.public_service_transport_id,
        w.reference_id,
        w.organization,
        w.phone_number,
        w.bus_number_going,
        w.bus_number_return,
        w.home_address,
        w.start_point_address,
        w.boarding_address,
        w.after_work_bus_pickup_address,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesBus = busFilter === 'all'
        || String(w.bus_number_going ?? '').trim() === busFilter
        || String(w.bus_number_return ?? '').trim() === busFilter;
      const matchesOrg = orgFilter === 'all' || w.organization === orgFilter;
      return matchesQuery && matchesBus && matchesOrg;
    });
  }, [workers, query, busFilter, orgFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateAndResetPage(setter) {
    return (val) => { setter(val); setPage(1); };
  }

  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('submissions.eyebrow')}
        title={t('submissions.title')}
        description={t('submissions.description', { shown: filtered.length, total: workers.length })}
      />

      <DataStatus />

      <FiltersBar
        query={query}
        onQuery={updateAndResetPage(setQuery)}
        busFilter={busFilter}
        onBusFilter={updateAndResetPage(setBusFilter)}
        buses={buses}
        orgFilter={orgFilter}
        onOrgFilter={updateAndResetPage(setOrgFilter)}
        organizations={organizations}
      />

      <SubmissionsTable rows={pageRows} onView={(worker) => setSelectedId(worker.id)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>
          {t('pagination.page_of', { page, total: totalPages })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('pagination.previous')}</button>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('pagination.next')}</button>
        </div>
      </div>

      <SubmissionDetailDrawer worker={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}