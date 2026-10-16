// Duplicate-ID alerts: deleting an alert is stored on the backend, so it
// stays deleted on every device and shows up in the audit log.
import { apiFetch } from './client';

export async function fetchDismissedAlertIds(token) {
  const data = await apiFetch('/api/admin/notifications/duplicates/dismissed', { token });
  return data?.employee_ids || [];
}

export function dismissAlerts(token, employeeIds) {
  return apiFetch('/api/admin/notifications/duplicates/dismiss', {
    method: 'POST',
    token,
    body: { employee_ids: employeeIds },
  });
}