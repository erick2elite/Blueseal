import React, { useState } from 'react';
import { FaLock, FaUser, FaCarSide } from 'react-icons/fa';
import { API_URL } from './api';
import './smvt.css';

const AdminLogin = ({ onLogin }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');
      localStorage.setItem('bluesealAdminToken', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="login-icon"><FaCarSide size={28} color="#fff" /></div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '.25rem' }}>Admin Access</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>BLUESEAL MOTOR MANAGER'S LTD (BMM)</p>
        </div>
        {error && <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '.9rem' }}>
            <label className="form-label">Username</label>
            <div className="input-group">
              <FaUser size={14} />
              <input type="text" placeholder="admin" value={creds.username} onChange={e => setCreds(p => ({ ...p, username: e.target.value }))} required autoComplete="username" />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <div className="input-group">
              <FaLock size={14} />
              <input type="password" placeholder="••••••••" value={creds.password} onChange={e => setCreds(p => ({ ...p, password: e.target.value }))} required autoComplete="current-password" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
