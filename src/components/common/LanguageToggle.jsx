import { useLocale } from '../../context/LocaleContext';

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t('topbar.language')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--slate-200)',
        borderRadius: 999,
        padding: 2,
        background: 'var(--paper)',
      }}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          background: locale === 'en' ? 'var(--teal-600)' : 'transparent',
          color: locale === 'en' ? '#FFFFFF' : 'var(--slate-500)',
        }}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => setLocale('am')}
        aria-pressed={locale === 'am'}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          background: locale === 'am' ? 'var(--teal-600)' : 'transparent',
          color: locale === 'am' ? '#FFFFFF' : 'var(--slate-500)',
        }}
      >
        አማ
      </button>
    </div>
  );
}