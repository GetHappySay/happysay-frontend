'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setStatus('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not send reset instructions.');
      }

      setStatus('If that email exists, reset instructions have been sent.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Could not send reset instructions.');
    } finally {
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
          Enter your account email and we’ll send a secure reset link.
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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span
              style={{
                color: 'var(--hs-muted)',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              Email address
            </span>

            <input
              className="hs-input"
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="hs-button" disabled={loading}>
            <span className="hs-button-content">
              {loading ? 'Sending...' : 'Send reset link'}
            </span>
          </button>
        </form>
      </section>
    </main>
  );
}