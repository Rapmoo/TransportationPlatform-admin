import { apiFetch } from './client';

// Candidate routes for "list all worker submissions". The worker app POSTs to
// /api/submissions, so the admin list is most likely one of these. Set
// VITE_SUBMISSIONS_PATH in .env to force a single exact path.
const FORCED_PATH = import.meta.env.VITE_SUBMISSIONS_PATH;
const CANDIDATE_PATHS = FORCED_PATH
  ? [FORCED_PATH]
  : ['/api/admin/submissions', '/api/submissions', '/admin/submissions', '/submissions'];

let workingPath = null;

const COORD_FIELDS = [
  'home_coords',
  'start_point_coords',
  'boarding_coords',
  'after_work_bus_pickup_coords',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function normalizeCoords(value) {
  if (!value) return null;
  const lat = Number(value.lat ?? value.latitude ?? value.y);
  const lon = Number(value.lon ?? value.lng ?? value.long ?? value.longitude ?? value.x);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function first(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== '');
}

// Reads one location whether the backend sends it flat (home_address,
// home_coords / home_lat + home_lon) or nested (locations.home.{address,lat,lon}).
const LOCATION_TYPE_BY_FLAT = {
  home: 'HOME',
  start_point: 'STARTING_POINT',
  boarding: 'BOARDING',
  after_work_bus_pickup: 'RETURN_STARTING_POINT',
};

function readLocation(raw, flat, nestedKeys) {
  // Backend shape: locations: [{ location_type, address_text, latitude, longitude }]
  if (Array.isArray(raw.locations)) {
    const type = LOCATION_TYPE_BY_FLAT[flat];
    const match = raw.locations.find((l) => String(l.location_type).toUpperCase() === type);
    if (match) {
      return {
        address: first(match.address_text, match.address),
        coords: normalizeCoords({ lat: match.latitude, lon: match.longitude }),
      };
    }
    return { address: undefined, coords: null };
  }
  const containers = [raw.locations, raw.location, raw];
  let nested = null;
  for (const c of containers) {
    for (const k of nestedKeys) {
      if (c && typeof c[k] === 'object' && c[k] !== null) { nested = c[k]; break; }
    }
    if (nested) break;
  }
  const address = first(raw[`${flat}_address`], nested?.address, nested?.text, typeof raw[flat] === 'string' ? raw[flat] : undefined);
  const coords = normalizeCoords(first(
    raw[`${flat}_coords`], raw[`${flat}_coordinates`], nested?.coords, nested?.coordinates, nested,
    { lat: raw[`${flat}_lat`] ?? raw[`${flat}_latitude`], lon: raw[`${flat}_lon`] ?? raw[`${flat}_lng`] ?? raw[`${flat}_longitude`] },
  ));
  return { address, coords };
}

function normalizeDatetime(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Maps one backend record to the shape the admin screens already use.
export function normalizeSubmission(raw) {
  const worker = { ...raw };

  worker.id = first(raw.id, raw.reference_id, raw.public_service_transport_id);
  worker.public_service_transport_id = first(
    raw.public_service_transport_id, raw.public_id, raw.public_transport_id, raw.transport_id, raw.employee_id,
  );
  worker.employee_name = first(raw.employee_name, raw.full_name, raw.worker_name, raw.name);
  worker.phone_number = first(raw.phone_number, raw.phone);
  worker.organization = first(raw.organization, raw.organization_name, raw.organisation, raw.company);
  worker.bus_number_going = first(raw.bus_number_going, raw.bus_going, raw.going_bus_number);
  worker.bus_number_return = first(raw.bus_number_return, raw.bus_return, raw.return_bus_number);

  const places = [
    ['home', 'home', ['home', 'home_location']],
    ['start_point', 'start_point', ['start', 'start_point', 'start_location', 'starting_point']],
    ['boarding', 'boarding', ['boarding', 'boarding_point', 'boarding_location']],
    ['after_work_bus_pickup', 'after_work_bus_pickup', ['after_work', 'afterWork', 'after_work_bus_pickup', 'after_work_pickup']],
  ];
  places.forEach(([flat, , nestedKeys]) => {
    const { address, coords } = readLocation(raw, flat, nestedKeys);
    worker[`${flat}_address`] = address;
    worker[`${flat}_coords`] = coords;
  });

  worker.submission_datetime = normalizeDatetime(
    first(raw.submission_datetime, raw.submitted_at, raw.created_at),
  );

  if (!worker.geocoding_status) {
    worker.geocoding_status = COORD_FIELDS.some((field) => worker[field]) ? 'success' : 'pending';
  }
  return worker;
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.submissions ?? data?.results ?? data?.data ?? null;
}

// Supervisors get address names but no coordinates from the list route, so the
// map would have nothing to plot. The GeoJSON route returns coordinates to
// both roles; fill in whatever the list left out.
async function addMissingCoords(list, token) {
  const needs = list.some((w) => Array.isArray(w.locations) && w.locations.some(
    (l) => l.latitude === undefined || l.longitude === undefined,
  ));
  if (!needs) return list;
  try {
    const base = workingPath ? workingPath.replace(/\/submissions$/, '') : '/api/admin';
    const geo = await apiFetch(`${base}/locations/geojson`, { token });
    const byKey = new Map();
    (geo?.features || []).forEach((f) => {
      const [lon, lat] = f.geometry?.coordinates || [];
      byKey.set(`${f.properties.submission_id}:${String(f.properties.location_type).toUpperCase()}`, { lat, lon });
    });
    return list.map((w) => ({
      ...w,
      locations: (w.locations || []).map((l) => {
        if (l.latitude !== undefined && l.longitude !== undefined) return l;
        const c = byKey.get(`${w.id}:${String(l.location_type).toUpperCase()}`);
        return c ? { ...l, latitude: c.lat, longitude: c.lon } : l;
      }),
    }));
  } catch {
    return list; // map just stays empty rather than breaking the list
  }
}

export async function fetchSubmissions(token) {
  const paths = workingPath ? [workingPath] : CANDIDATE_PATHS;
  const tried = [];

  for (const path of paths) {
    try {
      const sep = path.includes('?') ? '&' : '?';
      const data = await apiFetch(`${path}${sep}page=1&page_size=100`, { token });
      let list = extractList(data);
      if (!list) {
        tried.push(`${path} → unexpected response shape`);
        continue;
      }
      const totalPages = Number(data?.total_pages) || 1;
      for (let page = 2; page <= totalPages; page += 1) {
        const more = await apiFetch(`${path}${sep}page=${page}&page_size=100`, { token });
        list = list.concat(extractList(more) || []);
      }
      workingPath = path;
      if (import.meta.env.DEV && list[0]) {
        // Helps spot backend field names the admin does not read yet.
        console.info('[submissions] fields from backend:', Object.keys(list[0]));
      }
      return (await addMissingCoords(list, token)).map(normalizeSubmission);
    } catch (err) {
      // Wrong token / not allowed: no point trying other routes.
      if (err?.status === 401 || err?.status === 403) {
        throw new Error(`${path} → ${err.status} ${err.message}`);
      }
      tried.push(`${path} → ${err?.status || 'no connection'}`);
    }
  }

  throw new Error(`No submissions route answered. Tried: ${tried.join(', ')}`);
}