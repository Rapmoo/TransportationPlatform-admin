import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchSubmissions } from '../api/submissions';

const WorkerDataContext = createContext(null);

// Loads the submissions workers sent from the worker app. No mock fallback:
// until the backend answers, `workers` is an empty list.
export function WorkerDataProvider({ children }) {
  const { token } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setWorkers(await fetchSubmissions(token));
    } catch (err) {
      setWorkers([]);
      setError(err?.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(
    () => ({ workers, loading, error, reload }),
    [workers, loading, error, reload],
  );
  return <WorkerDataContext.Provider value={value}>{children}</WorkerDataContext.Provider>;
}

export function useWorkerData() {
  const ctx = useContext(WorkerDataContext);
  if (!ctx) throw new Error('useWorkerData must be used within a WorkerDataProvider');
  return ctx;
}