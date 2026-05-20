'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Login failed');
      }

      localStorage.setItem('happysay_token', data.token);
      localStorage.setItem('happysay_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          textAlign: 'left',
          padding: '30px',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <img
            src="/logo.svg"
            alt="HappySay"
            style={{
              width: '148px',
              height: 'auto',
              margin: '0 auto 22px',
              display: 'block',
            }}
          />

          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--hs-muted)',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            Welcome back
          </p>

          <h1 className="hs-title" style={{ margin: 0, fontSize: '30px' }}>
            Sign in to HappySay
          </h1>

          <p
            className="hs-copy"
            style={{
              margin: '10px 0 0',
              fontSize: '15px',
            }}
          >
            Check feedback, reply to customers, and stay ahead of issues.
          </p>
        </div>

        {error && (
          <div className="hs-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              required
              className="hs-input"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="hs-input"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="hs-button"
            style={{
              width: '100%',
              borderRadius: '999px',
              marginTop: '8px',
              opacity: loading ? 0.75 : 1,
            }}
          >
            <span className="hs-button-content">
              {loading ? 'Signing in...' : 'Sign in'}
            </span>
          </button>
        </form>

        <div
          style={{
            marginTop: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <a href="/signup" style={linkStyle}>
            Create account
          </a>

          <a href="/forgot-password" style={linkStyle}>
            Forgot password?
          </a>
        </div>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: '8px',
  marginBottom: '14px',
  color: 'var(--hs-text)',
  fontSize: '14px',
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--hs-navy)',
  fontSize: '14px',
  fontWeight: 800,
  textDecoration: 'none',
};