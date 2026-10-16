import { useCallback, useSyncExternalStore } from 'react';

// Remembers which alerts a supervisor has already opened, so the sidebar badge
// only counts new ones. Stored per user in localStorage and shared between the
// sidebar and the Alerts page.
const PREFIX = 'worker-transport-seen-alerts:';
const cache = {};
const listeners = new Set();

function read(key) {
  if (!(key in cache)) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      cache[key] = Array.isArray(parsed) ? parsed : [];
    } catch {
      cache[key] = [];
    }
  }
  return cache[key];
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// An alert counts as "new" again if more records join the same duplicate group.
export const alertSignature = (alert) => `${alert.id}:${alert.records.length}`;

export default function useSeenAlerts(userId) {
  const key = PREFIX + (userId ?? 'anon');
  const seen = useSyncExternalStore(subscribe, () => read(key));

  const markSeen = useCallback((alerts) => {
    const current = read(key);
    const next = Array.from(new Set([...current, ...alerts.map(alertSignature)]));
    if (next.length === current.length) return;
    cache[key] = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable — badge just resets on reload */
    }
    listeners.forEach((l) => l());
  }, [key]);

  return { seen, markSeen };
}