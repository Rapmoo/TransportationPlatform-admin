import { Search, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import LanguageToggle from '../common/LanguageToggle';
import ThemeToggle from '../common/ThemeToggle';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

export default function Topbar({ onMenuClick, sidebarOpen }) {
  const { user, logout } = useAuth();
  const { t } = useLocale();

  return (
    <header className="topbar">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onMenuClick}
        aria-label={t('sidebar.nav.reports')}
        aria-expanded={sidebarOpen}
      >
        <Menu size={17} />
      </button>

      <div className="topbar-search">
        <Search size={14} color="var(--slate-500)" />
        <input
          placeholder={t('topbar.search_placeholder')}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', minWidth: 0, color: 'var(--slate-900)' }}
        />
      </div>

      <div className="topbar-right">
        <LanguageToggle />
        <ThemeToggle />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--teal-100)',
              color: 'var(--teal-600)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12.5, fontWeight: 600, flexShrink: 0,
            }}
          >
            {initials(user?.name)}
          </div>
          <div className="topbar-user-text" style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>{user?.name || t('topbar.guest')}</div>
            <div style={{ fontSize: 11, color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
              {user?.role === 'Superadmin' ? t('login.role.superadmin') : user?.role === 'Supervisor' ? t('login.role.supervisor') : (user?.role || '')}
            </div>
          </div>
        </div>
        <button
          className="btn btn-sm"
          onClick={logout}
          style={{ border: '1px solid var(--slate-200)', background: 'transparent', color: 'var(--slate-500)' }}
        >
          <LogOut size={13} /> <span className="sign-out-label">{t('topbar.sign_out')}</span>
        </button>
      </div>
    </header>
  );
}