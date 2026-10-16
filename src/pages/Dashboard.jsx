import { ClipboardList, CalendarClock, Building2 } from 'lucide-react';
import PageHead from '../components/common/PageHead';
import StatCard from '../components/overview/StatCard';
import { SubmissionsTrendChart, TopBusNumbers, OrganizationTable } from '../components/overview/OverviewCharts';
import { useLocale } from '../context/LocaleContext';
import { useWorkerData } from '../context/WorkerDataContext';
import DataStatus from '../components/common/DataStatus';

export default function Dashboard() {
  const { t } = useLocale();
  const { workers } = useWorkerData();
  const today = new Date().toISOString().slice(0, 10);
  const organizations = new Set(workers.map((worker) => worker.organization)).size;
  const todayCount = workers.filter((worker) => worker.submission_datetime?.replace(' ', 'T').startsWith(today)).length;

  return (
    <div className="page-body">
      <PageHead eyebrow={t('dashboard.eyebrow')} title={t('dashboard.title')} description={t('dashboard.description')} />

      <DataStatus />

      <div className="metric-grid">
        <StatCard label={t('dashboard.stat.total_submissions')} value={workers.length} sublabel={t('dashboard.stat.total_submissions_sub')} accent="var(--teal-600)" icon={ClipboardList} />
        <StatCard label={t('dashboard.stat.todays_submissions')} value={todayCount} sublabel={t('dashboard.stat.todays_submissions_sub')} accent="var(--green-600)" icon={CalendarClock} />
        <StatCard label={t('dashboard.stat.organizations')} value={organizations} sublabel={t('dashboard.stat.organizations_sub')} accent="var(--amber-600)" icon={Building2} />
      </div>

      <div className="charts-grid">
        <SubmissionsTrendChart workers={workers} />
        <TopBusNumbers workers={workers} />
      </div>

      <OrganizationTable workers={workers} />
    </div>
  );
}