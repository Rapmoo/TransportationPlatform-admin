import { useMemo } from 'react';
import { useWorkerData } from '../context/WorkerDataContext';
import { useAuth } from '../context/AuthContext';
import useDismissedAlerts from './useDismissedAlerts';

// Builds the list of alerts shown under "Alerts" in the sidebar.
// Add new alert types here and they appear on the Alerts page and in the badge.
export default function useAlerts() {
  const { workers } = useWorkerData();
  const { user, token } = useAuth();
  const { dismissedIds, ready } = useDismissedAlerts(user?.role === 'Supervisor' ? token : null);

  return useMemo(() => {
    if (user?.role !== 'Supervisor' || !ready) return [];

    const groups = {};
    workers.forEach((worker) => {
      const id = String(worker.public_service_transport_id || '').trim();
      if (!id) return;
      (groups[id] ||= []).push(worker);
    });

    return Object.entries(groups)
      .filter(([publicId, rows]) => rows.length > 1 && !dismissedIds.includes(publicId))
      .map(([publicId, rows]) => ({
        id: `duplicate-${publicId}`,
        type: 'duplicate_public_id',
        publicId,
        records: rows,
      }));
  }, [workers, user?.role, dismissedIds, ready]);
}