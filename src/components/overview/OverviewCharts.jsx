import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useLocale } from '../../context/LocaleContext';

const tooltipStyle = {
  fontSize: 12.5,
  fontFamily: 'var(--font-ui)',
  border: '1px solid var(--slate-200)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(15,39,51,0.08)',
};

function weeklySubmissions(workers, weeks = 6) {
  const DAY = 24 * 60 * 60 * 1000;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const buckets = Array.from({ length: weeks }, (_, i) => ({ week: `Wk ${i + 1}`, submissions: 0 }));
  workers.forEach((w) => {
    const d = new Date(String(w.submission_datetime || '').replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return;
    const age = Math.floor((end.getTime() - d.getTime()) / (7 * DAY));
    if (age >= 0 && age < weeks) buckets[weeks - 1 - age].submissions += 1;
  });
  return buckets;
}

export function SubmissionsTrendChart({ workers = [] }) {
  const { t } = useLocale();
  const submissionsByWeek = weeklySubmissions(workers);
  return (
    <div className="panel report-panel">
      <div className="panel-head">
        <h3>{t('dashboard.chart.submissions_received')}</h3>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>{t('dashboard.chart.last_6_weeks')}</span>
      </div>
      <div className="panel-body" style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={submissionsByWeek} margin={{ left: -18, top: 6 }}>
            <defs>
              <linearGradient id="fillSubs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#159AA6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#159AA6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--slate-100)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11.5, fill: 'var(--slate-500)' }} axisLine={{ stroke: 'var(--slate-200)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11.5, fill: 'var(--slate-500)' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="submissions" stroke="#0E7C86" strokeWidth={2} fill="url(#fillSubs)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OrganizationTable({ workers }) {
  const { t } = useLocale();
  const organizationBreakdown = Object.entries(workers.reduce((acc, w) => {
    acc[w.organization] = (acc[w.organization] || 0) + 1;
    return acc;
  }, {})).map(([organization, count]) => ({ organization, count }));
  const total = organizationBreakdown.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <div className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3>{t('dashboard.chart.submissions_by_org')}</h3>
          <div style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 3 }}>{t('dashboard.chart.organization_note')}</div>
        </div>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>{total} {t('dashboard.chart.records')}</span>
      </div>
      <div className="scroll-x">
        <table className="report-table">
          <thead><tr><th>{t('dashboard.chart.organization')}</th><th style={{ textAlign: 'right' }}>{t('dashboard.chart.submissions_number')}</th><th style={{ textAlign: 'right' }}>{t('dashboard.chart.share')}</th></tr></thead>
          <tbody>
            {organizationBreakdown.sort((a, b) => b.count - a.count).map((row) => (
              <tr key={row.organization}>
                <td style={{ fontWeight: 500 }}>{row.organization}</td>
                <td className="mono report-number">{row.count}</td>
                <td className="mono report-share">{((row.count / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TopBusNumbers({ workers = [] }) {
  const { t } = useLocale();
  const busCounts = new Map();

  workers.forEach((worker) => {
    // Count a worker once per bus number, even when the same number is used
    // for both the going and returning journeys.
    const workerBuses = new Set(
      [worker.bus_number_going, worker.bus_number_return]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean),
    );
    workerBuses.forEach((number) => busCounts.set(number, (busCounts.get(number) || 0) + 1));
  });

  const topBuses = Array.from(busCounts, ([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count || a.number.localeCompare(b.number, undefined, { numeric: true }))
    .slice(0, 10);
  const maxCount = topBuses[0]?.count || 1;

  return (
    <div className="panel report-panel top-bus-panel">
      <div className="panel-head">
        <div>
          <h3>{t('dashboard.bus.top10_title')}</h3>
          <div style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 3 }}>
            {t('dashboard.bus.top10_note')}
          </div>
        </div>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
          {topBuses.length}/10
        </span>
      </div>
      {topBuses.length ? (
        <div className="top-bus-list">
          {topBuses.map((bus, index) => (
            <div className="top-bus-row" key={bus.number}>
              <span className="top-bus-rank">{String(index + 1).padStart(2, '0')}</span>
              <div className="top-bus-info">
                <div className="top-bus-meta">
                  <strong>{t('dashboard.bus.number', { number: bus.number })}</strong>
                  <span className="top-bus-count">{bus.count} {t('dashboard.bus.workers')}</span>
                </div>
                <div className="top-bus-track" aria-label={`${bus.count} ${t('dashboard.bus.workers')}`}>
                  <span style={{ width: `${(bus.count / maxCount) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="top-bus-empty">{t('dashboard.bus.top10_empty')}</div>
      )}
    </div>
  );
}