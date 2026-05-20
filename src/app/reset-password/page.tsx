'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');

    if (!resetToken) {
      setError('This reset link is missing or invalid.');
      return;
    }

    setToken(resetToken);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setError('');
    setStatus('');
    setLoading(true);

    try {
      if (!token) {
        throw new Error('This reset link is missing or invalid.');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }

      if (password !== confirm) {
        throw new Error('Passwords do not match.');
      }

      const res = await fetch(`${API_BASE}/api/auth/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not reset password.');
      }

      setStatus('Password updated. Redirecting to login...');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '34px',
          textAlign: 'left',
        }}
      >
        <a
          href="/login"
          style={{
            display: 'inline-flex',
            marginBottom: '18px',
            color: 'var(--hs-navy)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 800,
          }}
        >
          ← Back to login
        </a>

        <h1 className="hs-title" style={{ margin: '0 0 8px' }}>
          Reset your password
        </h1>

        <p className="hs-copy" style={{ textAlign: 'left', margin: '0 0 22px' }}>
          Create a new password for your HappySay account.
        </p>

        {error && (
          <div className="hs-error" style={{ marginBottom: '14px' }}>
            {error}
          </div>
        )}

        {status && (
          <div className="hs-success" style={{ marginBottom: '14px' }}>
            {status}
          </div>
        )}

        {!status && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span
                style={{
                  color: 'var(--hs-muted)',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                New password
              </span>

              <input
                className="hs-input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span
                style={{
                  color: 'var(--hs-muted)',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                Confirm password
              </span>

              <input
                className="hs-input"
                type="password"
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <button type="submit" className="hs-button" disabled={loading || !token}>
              <span className="hs-button-content">
                {loading ? 'Updating password...' : 'Update password'}
              </span>
            </button>
          </form>
        )}
      </section>
    </main>
  );
}