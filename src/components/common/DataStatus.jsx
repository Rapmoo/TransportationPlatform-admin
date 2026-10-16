import { useWorkerData } from '../../context/WorkerDataContext';
import { useLocale } from '../../context/LocaleContext';

// Shows loading / error / empty state for the worker submissions feed.
export default function DataStatus() {
  const { workers, loading, error, reload } = useWorkerData();
  const { t } = useLocale();

  if (loading) {
    return <div className="panel" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{t('data.loading')}</div>;
  }
  if (error) {
    return (
      <div className="panel" role="alert" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--red-600, #B42318)' }}>{t('data.error', { message: error })}</span>
        <button className="btn btn-sm" onClick={reload}>{t('data.retry')}</button>
      </div>
    );
  }
  if (workers.length === 0) {
    return <div className="panel" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{t('data.empty')}</div>;
  }
  return null;
}