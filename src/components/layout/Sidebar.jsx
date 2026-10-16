import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, ClipboardList, Inbox, Bell, Map, Download, Users, ScrollText, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import publicTransportMark from '../../assets/logos/public-transport-mark.png';
import publicTransportLogo from '../../assets/logos/public-transport-logo-clean.png';
import { useLocale } from '../../context/LocaleContext';
import useAlerts from '../../hooks/useAlerts';
import useSeenAlerts, { alertSignature } from '../../hooks/useSeenAlerts';

const NAV_ITEMS = [
  { to: '/', label: 'Reports', icon: LayoutGrid, end: true, roles: ['Superadmin', 'Supervisor'] },
  { to: '/submissions', label: 'Submissions', icon: ClipboardList, roles: ['Superadmin', 'Supervisor'] },
  { to: '/requests', labelKey: 'sidebar.nav.requests', label: 'Requests', icon: Inbox, roles: ['Supervisor'] },
  { to: '/alerts', labelKey: 'sidebar.nav.alerts', label: 'Alerts', icon: Bell, roles: ['Supervisor'], badgeKey: 'alerts' },
  { to: '/map', label: 'GIS Map', icon: Map, roles: ['Superadmin', 'Supervisor'] },
  { to: '/exports', label: 'Export', icon: Download, roles: ['Superadmin'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['Superadmin'] },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText, roles: ['Superadmin'] },
];

export default function Sidebar({ isOpen, collapsed, onCollapse }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const alerts = useAlerts();
  const { seen } = useSeenAlerts(user?.id);
  // Badge counts only alerts the supervisor has not opened yet.
  const badges = { alerts: alerts.filter((a) => !seen.includes(alertSignature(a))).length };
  const role = user?.role || 'Supervisor';
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-top">
          <div className="sidebar-brand-mark">
            <img className="sidebar-transport-logo sidebar-transport-logo-full" src={publicTransportLogo} alt="Public Service Transport Service" />
            <img className="sidebar-transport-logo sidebar-transport-logo-mark" src={publicTransportMark} alt="Public Service Transport Service" />
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-title">Worker Transport</div>
          <div className="sidebar-brand-subtitle">GIS Platform · {role}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label: fallbackLabel, labelKey, icon: Icon, end, badgeKey }) => {
          const label = labelKey ? t(labelKey) : fallbackLabel;
          const badge = badgeKey ? badges[badgeKey] : 0;
          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="sidebar-link"
            title={collapsed ? label : undefined}
            style={{ position: 'relative' }}
          >
            <Icon size={17} strokeWidth={2} />
            <span className="sidebar-link-label">{label}</span>
            {badge > 0 && (
              <span
                aria-label={`${badge} ${label}`}
                style={collapsed
                  ? { position: 'absolute', top: 4, right: 6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#D85C3A', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                  : { marginLeft: 'auto', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: '#D85C3A', color: '#fff', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {badge}
              </span>
            )}
          </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-powered-label">{t('sidebar.powered_by')}</div>
      </div>
    </aside>
  );
}