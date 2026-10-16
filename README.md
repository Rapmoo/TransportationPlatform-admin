# Worker Transportation Admin Dashboard (Frontend)

Admin dashboard for the Worker Transportation Data Collection & GIS Platform.
Built with **React + Vite** and **OpenLayers**, using **mock data only** — no
backend or database is included or required.

This is a **worker data collection + GIS analysis system, not an approval
system**. A submission is simply "Submitted" — there is no review, approval,
or verification workflow. Two roles are supported (Administrator and
Supervisor), both with full access to their own submitted data; neither role
can approve, reject, or flag another worker's record.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

To produce a production build:

```bash
npm run build
npm run preview
```

## Structure

```
src/
  components/
    layout/       Sidebar, Topbar, page shell (role-aware nav)
    overview/     Stat cards, charts (Reports/Dashboard)
    submissions/  Filters, table, detail drawer (no approval actions)
    map/          OpenLayers map + layer control/legend
    geocoding/    Status grouping (success/pending/failed) — geocoding only
    exports/      CSV/Excel/GeoJSON/GeoPackage placeholder buttons
    settings/     Placeholder configuration panel
    users/        Users table (Administrator only)
    audit/        Audit log table (Administrator + Supervisor)
    auth/         RequireAuth / RequireRole route guards
    common/       Shared PageHead, StatusBadge
  context/
    AuthContext.jsx  Mock login/logout, current user + role, persisted to
                     localStorage
  data/
    mockData.js   Worker submission records, stats, and chart data
    auditData.js  Mock users and audit log entries
  pages/
    Login.jsx, Dashboard.jsx, Submissions.jsx, GISMapPage.jsx, Geocoding.jsx,
    Exports.jsx, Users.jsx, AuditLog.jsx, Settings.jsx
```

## Roles

- **Administrator** — Submissions, GIS, Reports, Geocoding, Users, Settings,
  Audit Log.
- **Supervisor** — Submissions, GIS, Reports, Geocoding, Export, Audit Log.

There is no approval workflow for either role. Login is a mock screen (any
name/username is accepted) that lets you pick which role to sign in as, so
both sides of the dashboard are easy to demo before a real auth backend is
wired up.

## Connecting to Tseday's FastAPI backend

Every page reads from `src/data/mockData.js` or `src/data/auditData.js`. To
wire up real data:

1. Replace the imports from `../data/mockData` in each page (`Dashboard.jsx`,
   `Submissions.jsx`, `GISMapPage.jsx`, `Geocoding.jsx`) with API calls
   (e.g. `fetch('/api/submissions')` or a small `src/api/client.js` module).
2. Keep the same field names used in `mockData.js` — `employee_id`,
   `employee_name`, `phone_number`, `job_position`, `organization`,
   `home_address`, `home_coords: {lat, lon}`, `start_point_address`,
   `start_point_coords`, `boarding_address`, `boarding_coords`,
   `geocoding_status` (`success` | `pending` | `failed`), and
   `submission_datetime` — so no component code has to change, only the
   data source. There is no `status` field for approval; a record's
   existence means it was submitted.
3. Replace `AuthContext`'s `login()` with a real call to your auth endpoint,
   and swap `src/data/auditData.js`'s `users`/`auditLog` for
   `/api/users` and `/api/audit-log`.
4. In `Exports.jsx` / `ExportsPanel.jsx`, replace the disabled buttons with
   calls to the real export endpoints once available, and remove the
   `disabled` attribute.
5. `Settings.jsx` currently shows read-only placeholder fields — hook these
   up to a real config endpoint when one exists.

## Notes

- Mock data (86 worker records) is seeded deterministically in
  `mockData.js`, centered on Addis Ababa, so map coordinates and addresses
  are realistic and stable across reloads. A few records are dated "today"
  so the Reports page's "Today's submissions" stat has something to show.
- The GIS map uses CARTO's light basemap tiles over OpenStreetMap data
  (no API key required) and renders three independently toggleable vector
  layers: home locations, starting transportation points, and boarding
  points.
- The Public Service Transport and SSGI logos on the login screen and
  sidebar are the official assets provided with this update.
