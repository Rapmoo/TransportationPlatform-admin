import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LocaleContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('topbar.theme_dark') : t('topbar.theme_light')}
      title={isDark ? t('topbar.theme_dark') : t('topbar.theme_light')}
      className="btn btn-sm"
      style={{
        border: '1px solid var(--slate-200)',
        background: 'var(--paper)',
        color: 'var(--slate-700)',
        padding: '6px 10px',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}