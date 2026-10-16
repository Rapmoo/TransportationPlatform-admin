const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('worker-transport-token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response has no JSON body.
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}.`;

    throw new Error(
      typeof message === 'string'
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}

export async function loginRequest(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}