import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import LanguageToggle from '../components/common/LanguageToggle';
import ThemeToggle from '../components/common/ThemeToggle';
import publicTransportLogo from '../assets/logos/public-transport-logo.png';
import ssgiLogo from '../assets/logos/ssgi-logo.png';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F2733',
        padding: 'clamp(12px, 5vw, 20px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--white)',
          borderRadius: 8,
          border: '1px solid var(--slate-200)',
          padding: 'clamp(20px, 6vw, 32px) clamp(18px, 6vw, 32px) 28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 20, flexWrap: 'nowrap' }}>
          <img src={publicTransportLogo} alt="Public Service Transport Service" style={{ height: 64, width: 'auto', maxWidth: '45%', objectFit: 'contain', display: 'block' }} />
          <div style={{ width: 1, height: 48, flexShrink: 0, background: 'var(--slate-200)' }} />
          <img src={ssgiLogo} alt="Space Science and Geospatial Institute" style={{ height: 52, width: 'auto', maxWidth: '45%', objectFit: 'contain', display: 'block' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 19, marginTop: 0 }}>{t('login.title')}</h1>
          <p style={{ fontSize: 12.5, color: 'var(--slate-500)', margin: '6px 0 0' }}>
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field
            label={t('login.field.username')}
            value={username}
            onChange={setUsername}
            placeholder={t('login.field.username_placeholder')}
            autoComplete="username"
          />
          <Field
            label={t('login.field.password')}
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <div role="alert" style={{ color: '#C0392B', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ justifyContent: 'center', marginTop: 4, padding: '10px 14px' }}
          >
            <LogIn size={15} /> {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, autoComplete }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%', border: '1px solid var(--slate-200)', borderRadius: 5,
          padding: '9px 11px', fontSize: 13.5, color: 'var(--slate-900)',
        }}
      />
    </label>
  );
}