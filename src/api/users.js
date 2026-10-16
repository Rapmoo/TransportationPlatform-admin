// Staff accounts, managed on the backend.
import { apiFetch } from './client';

export async function fetchUsers(token) {
  const data = await apiFetch('/api/admin/users', { token });
  return data?.users || [];
}

// Username and password are required: the admin must supply both.
export function createStaffUser(token, { name, role, username, password }) {
  return apiFetch('/api/auth/staff', {
    method: 'POST',
    token,
    body: { name, role, username, password },
  });
}

export function setUserActive(token, id, isActive) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    token,
    params: { is_active: isActive },
  });
}