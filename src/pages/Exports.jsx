import PageHead from '../components/common/PageHead';
import ExportsPanel from '../components/exports/ExportsPanel';
import { useLocale } from '../context/LocaleContext';

export default function Exports() {
  const { t } = useLocale();
  return (
    <div className="page-body">
      <PageHead
        eyebrow={t('exports.eyebrow')}
        title={t('exports.title')}
        description={t('exports.description')}
      />
      <ExportsPanel />
    </div>
  );
}