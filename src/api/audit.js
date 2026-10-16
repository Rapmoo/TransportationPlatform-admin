// Audit trail, stored by the backend (audit_logs table).
//  - Reading:   GET  /api/admin/audit-logs
//  - Recording: the server logs logins, edits, account changes itself; the
//    browser only reports what the server can't see (logout, viewing a
//    record or the map, client-side exports) via POST /audit-logs/events.
import { apiFetch } from './client';
import { formatUtc } from '../utils/formatTime';

const SESSION_KEY = 'worker-transport-auth';

// Staff (admin/supervisor) actions shown in the log; used for the filter.
export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'RECORD_VIEW',
  'MAP_VIEW',
  'DATA_EXPORT',
  'CHANGE_REQUEST_APPROVED',
  'CHANGE_REQUEST_REJECTED',
  'ADMIN_EDIT',
  'STAFF_STATUS_CHANGE',
  'DUPLICATE_ACKNOWLEDGED',
  'DUPLICATE_ALERT_DELETED',
  'USER_CREATED',
  'USER_STATUS_CHANGE',
  'USER_CREDENTIALS_CHANGE',
];

const ROLE_LABELS = { ADMIN: 'Superadmin', SUPERVISOR: 'Supervisor' };

export function normalizeAuditEntry(raw) {
  const change = raw.old_status || raw.new_status
    ? `${raw.old_status || '—'} → ${raw.new_status || '—'}`
    : '';
  return {
    id: raw.id,
    datetime: formatUtc(raw.created_at),
    user: raw.actor_name || '',
    role: ROLE_LABELS[raw.actor_role] || raw.actor_role || '',
    action: raw.action,
    detail: [raw.details, change].filter(Boolean).join(' · '),
  };
}

export async function fetchAuditLogs(token, { page = 1, pageSize = 15, action, search } = {}) {
  const data = await apiFetch('/api/admin/audit-logs', {
    token,
    params: {
      page,
      page_size: pageSize,
      action: action && action !== 'all' ? action : undefined,
      search: search ? search.trim() : undefined,
    },
  });
  return {
    items: (data?.items || []).map(normalizeAuditEntry),
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
  };
}

let lastKey = '';
let lastAt = 0;

/** Report a browser-side event. Fire-and-forget: never blocks or throws. */
export function recordAudit(action, details = '') {
  let token = null;
  try { token = JSON.parse(localStorage.getItem(SESSION_KEY))?.token ?? null; } catch { /* no session */ }
  if (!token) return;

  // Swallow double-fires (React StrictMode runs effects twice in dev).
  const key = `${action}|${details}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 2000) return;
  lastKey = key;
  lastAt = now;

  apiFetch('/api/admin/audit-logs/events', {
    method: 'POST',
    token,
    body: { action, details },
  }).catch(() => { /* auditing must never break the action itself */ });
}