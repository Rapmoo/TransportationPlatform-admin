import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { dismissAlerts, fetchDismissedAlertIds } from '../api/alerts';

// Shared (sidebar badge + Alerts page) list of deleted duplicate-ID alerts,
// loaded once per login from the backend.
let state = { token: null, ids: [], loaded: false };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getState = () => state;

async function load(token) {
  if (!token || (state.token === token && state.loaded)) return;
  state = { token, ids: [], loaded: false };
  emit();
  let ids = [];
  try { ids = await fetchDismissedAlertIds(token); } catch { /* show all alerts if it can't load */ }
  if (state.token !== token) return;
  state = { token, ids, loaded: true };
  emit();
}

export default function useDismissedAlerts(token) {
  const snapshot = useSyncExternalStore(subscribe, getState);
  useEffect(() => { load(token); }, [token]);

  // Deletes alerts on the server; throws with the server's message on failure.
  const dismiss = useCallback(async (publicIds) => {
    await dismissAlerts(token, publicIds);
    state = { ...state, ids: Array.from(new Set([...state.ids, ...publicIds])) };
    emit();
  }, [token]);

  return {
    dismissedIds: snapshot.token === token ? snapshot.ids : [],
    ready: snapshot.token === token && snapshot.loaded,
    dismiss,
  };
}