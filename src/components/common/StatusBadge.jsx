import { useLocale } from '../../context/LocaleContext';

const KEY_MAP = {
  success: { cls: 'status-success', labelKey: 'status.geocoded' },
  pending: { cls: 'status-pending', labelKey: 'status.pending' },
  failed: { cls: 'status-failed', labelKey: 'status.failed' },
  Submitted: { cls: 'status-neutral', labelKey: 'status.submitted' },
};

export default function StatusBadge({ value }) {
  const { t } = useLocale();
  const entry = KEY_MAP[value];
  const label = entry ? t(entry.labelKey) : value;
  const cls = entry ? entry.cls : 'status-neutral';
  return <span className={`status ${cls}`}>{label}</span>;
}