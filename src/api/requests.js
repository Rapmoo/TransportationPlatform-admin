import { apiFetch } from './client';


const BASE = '/api/change-requests';
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

function unpackComment(comment) {
  const text = comment || '';
  const full = /^Field: (.*)\nCurrent value: (.*)\nRequested value: ([\s\S]*)\nReason: ([\s\S]*)$/.exec(text);
  if (full) return { field: full[1], current: full[2], requested: full[3], reason: full[4] };
  const legacy = /^Field: (.*)\nRequested value: ([\s\S]*)\nReason: ([\s\S]*)$/.exec(text);
  if (legacy) return { field: legacy[1], current: '', requested: legacy[2], reason: legacy[3] };
  return { field: '', current: '', requested: '', reason: text };
}

export function normalizeRequest(raw) {
  const parsed = unpackComment(raw.worker_comment);
  return {
    id: raw.public_id,
    status: String(raw.status || 'PENDING').toUpperCase(),
    created_at: raw.created_at ?? '',
    employee_name: raw.employee_name ?? '',
    employee_id: raw.employee_id ?? '',
    submission_number: raw.submission_number ?? '',
    field: parsed.field,
    current_value: parsed.current,
    requested_value: parsed.requested,
    reason: parsed.reason,
    admin_note: raw.review_comment ?? '',
    reviewed_at: raw.reviewed_at ?? '',
    edit_expires_at: raw.edit_expires_at ?? '',
  };
}

export async function fetchCorrectionRequests(token, status = 'PENDING') {
  // The backend has no "all" filter, so ALL = the three statuses merged.
  const wanted = status === 'ALL' ? STATUSES : [status];
  const lists = await Promise.all(
    wanted.map((s) => apiFetch(BASE, { token, params: { status: s } })),
  );

  return lists
    .flat()
    .map(normalizeRequest)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

async function decide(token, id, action, note) {
  return apiFetch(`${BASE}/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
    token,
    body: { review_comment: note || null },
  });
}

export const approveCorrectionRequest = (token, id, note) => decide(token, id, 'approve', note);
export const rejectCorrectionRequest = (token, id, note) => decide(token, id, 'reject', note);