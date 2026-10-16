import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkerDataProvider } from './context/WorkerDataContext';
import { RequireAuth, RequireRole } from './components/auth/RouteGuards';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Submissions from './pages/Submissions';
import Requests from './pages/Requests';
import Alerts from './pages/Alerts';
import GISMapPage from './pages/GISMapPage';
import Exports from './pages/Exports';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<WorkerDataProvider><Layout /></WorkerDataProvider>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submissions" element={<Submissions />} />
              <Route element={<RequireRole roles={['Supervisor']} />}>
                <Route path="/requests" element={<Requests />} />
                <Route path="/alerts" element={<Alerts />} />
              </Route>
              <Route path="/map" element={<GISMapPage />} />
              <Route element={<RequireRole roles={['Superadmin']} />}>
                <Route path="/exports" element={<Exports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/audit-log" element={<AuditLog />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}