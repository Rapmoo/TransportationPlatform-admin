// Thin fetch wrapper for the FastAPI backend.
//
// Base URL comes from VITE_API_BASE_URL (set it in a .env file for the
// frontend) and falls back to the backend's default local dev address.
const DEFAULT_API_BASE_URL = 'http://localhost:8000';

const configuredApiBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl || (import.meta.env?.DEV ? DEFAULT_API_BASE_URL : '');

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path, params) {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL is not configured for this deployment.', 0, null);
  }
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  let relative = path.replace(/^\//, '');
  // If the base URL already ends in /api (e.g. http://127.0.0.1:8000/api),
  // don't add a second /api from a path that also starts with it.
  if (/\/api\/$/.test(base) && /^api\//.test(relative)) {
    relative = relative.slice(4);
  }
  const url = new URL(relative, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return `Request failed (${response.status}).`;
  }

  const payload = await response.json().catch(() => null);
  const detail = payload?.detail;

  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return `Request failed (${response.status}).`;
}

// Called when an authenticated request comes back 401 (expired/invalid JWT).
// AuthContext registers a handler that clears the stale session so the route
// guards send the user back to the login page instead of showing empty data.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function handleUnauthorized(response, token) {
  if (response.status === 401 && token && unauthorizedHandler) {
    unauthorizedHandler();
  }
}

/**
 * Call a JSON endpoint on the backend.
 * Pass `token` (the bearer JWT) for any endpoint that requires auth.
 */
export async function apiFetch(path, { method = 'GET', token, body, params } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', 0, null);
  }

  if (!response.ok) {
    handleUnauthorized(response, token);
    throw new ApiError(await readErrorMessage(response), response.status, null);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;

  return response.json();
}

/**
 * Download a file-returning endpoint (CSV/Excel/GeoJSON export) and save it
 * to disk via the browser, using the filename the server suggests.
 */
export async function apiDownload(path, { token, params, filename } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), { method: 'GET', headers });
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', 0, null);
  }

  if (!response.ok) {
    handleUnauthorized(response, token);
    throw new ApiError(await readErrorMessage(response), response.status, null);
  }

  const blob = await response.blob();

  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const resolvedFilename = filename || match?.[1] || 'export';

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = resolvedFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}