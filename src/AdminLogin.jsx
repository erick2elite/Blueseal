import React, { useState, useEffect } from 'react';
import { FaLock, FaUser, FaEye, FaEyeSlash, FaShieldAlt, FaClock } from 'react-icons/fa';
import { API_URL } from './api';
import './smvt.css';

const AdminLogin = ({ onLogin }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Countdown timer for security lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creds.username.trim(),
          password: creds.password,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const retrySec = data.retryAfterSeconds || 900;
        setLockoutSeconds(retrySec);
        setError(data.message || 'Account temporarily locked due to multiple failed attempts.');
        return;
      }

      if (!res.ok) {
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data.message || 'Invalid credentials');
      }

      setRemainingAttempts(null);
      localStorage.setItem('bluesealAdminToken', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLockoutTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="login-icon">
            <FaShieldAlt size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '.25rem' }}>
            Dealer Admin Access
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>
            BLUESEAL MOTOR MANAGER'S LTD (BMM) · Kiambu Road
          </p>
        </div>

        {lockoutSeconds > 0 && (
          <div
            className="alert alert--error"
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '.5rem',
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1.5px solid #dc2626',
            }}
          >
            <FaClock size={16} color="#ef4444" />
            <div>
              <strong>Security Lockout:</strong> Too many failed attempts.
              <div style={{ fontSize: '.8rem', marginTop: '.2rem' }}>
                Retry available in <strong>{formatLockoutTime(lockoutSeconds)}</strong>
              </div>
            </div>
          </div>
        )}

        {error && lockoutSeconds <= 0 && (
          <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>
            {error}
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <div style={{ fontSize: '.8rem', marginTop: '.3rem', opacity: 0.9 }}>
                ⚠️ <strong>{remainingAttempts}</strong> attempt{remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Username</label>
            <div className="input-group">
              <FaUser size={14} />
              <input
                type="text"
                placeholder="admin"
                value={creds.username}
                onChange={(e) => {
                  setError('');
                  setCreds((p) => ({ ...p, username: e.target.value }));
                }}
                disabled={lockoutSeconds > 0}
                required
                autoComplete="username"
                maxLength={50}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <div className="input-group" style={{ position: 'relative' }}>
              <FaLock size={14} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={creds.password}
                onChange={(e) => {
                  setError('');
                  setCreds((p) => ({ ...p, password: e.target.value }));
                }}
                disabled={lockoutSeconds > 0}
                required
                autoComplete="current-password"
                maxLength={100}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Authenticating…' : lockoutSeconds > 0 ? `Locked (${formatLockoutTime(lockoutSeconds)})` : 'Sign In Securely'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
