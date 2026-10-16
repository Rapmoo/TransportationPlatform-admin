// Staff accounts, managed on the backend.
import { apiFetch } from './client';

export async function fetchUsers(token) {
  const data = await apiFetch('/api/admin/users', { token });
  return data?.users || [];
}

// Username and password are optional — the server generates what's missing
// and returns a generated password once as `temporary_password`.
export function createStaffUser(token, { name, role, username, password }) {
  return apiFetch('/api/auth/staff', {
    method: 'POST',
    token,
    body: {
      name,
      role,
      username: username || undefined,
      password: password || undefined,
    },
  });
}

export function setUserActive(token, id, isActive) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    token,
    params: { is_active: isActive },
  });
}