import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setUnauthorizedHandler } from '../api/client';
import { recordAudit } from '../api/audit';

const AuthContext = createContext(null);
const STORAGE_KEY = 'worker-transport-auth';

// Backend roles (ADMIN/SUPERVISOR) vs the labels the rest of the UI
// (route guards, sidebar, etc.) already keys off of.
const ROLE_LABELS = {
  ADMIN: 'Superadmin',
  SUPERVISOR: 'Supervisor',
};

function mapRole(backendRole) {
  return ROLE_LABELS[backendRole] || backendRole;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — session just won't persist across reloads */
    }
  }, [session]);

  async function login(username, password) {
    const tokenResponse = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    // The login response already includes the user; only fall back to a
    // second request for older backends that don't send it.
    const profile =
      tokenResponse.user ??
      (await apiFetch('/auth/me', { token: tokenResponse.access_token }));

    setSession({
      token: tokenResponse.access_token,
      user: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        role: mapRole(profile.role),
      },
    });
    // The backend records the LOGIN event itself.
  }

  function logout() {
    recordAudit('LOGOUT'); // sent before the token is cleared
    setSession(null);
  }

  // Any authenticated API call that returns 401 means the JWT expired (or the
  // server's SECRET_KEY changed): drop the stale session so the user is sent
  // back to the login page and gets a fresh token.
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Refresh fields on the signed-in user (e.g. after changing own username).
  function updateUser(changes) {
    setSession((prev) => (prev ? { ...prev, user: { ...prev.user, ...changes } } : prev));
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}