'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function BillingSuccessPage() {
  const [status, setStatus] = useState('Verifying your upgrade...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifySession() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          throw new Error('Missing Stripe session ID.');
        }

        const res = await fetch(`${API_BASE}/api/stripe/session?sessionId=${sessionId}`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Unable to verify checkout.');
        }

        setStatus('Checkout complete. We’re updating your account now...');

        setTimeout(() => {
          window.location.href = '/account';
        }, 1800);
      } catch (err: any) {
        setError(err.message || 'Unable to verify checkout.');
      }
    }

    verifySession();
  }, []);

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '36px',
        }}
      >
        <h1 className="hs-title" style={{ margin: '0 0 10px' }}>
          You're all set.
        </h1>

        {error ? (
          <>
            <p className="hs-copy" style={{ margin: '0 0 18px' }}>
              {error}
            </p>

            <a href="/account" className="hs-button" style={{ borderRadius: '999px' }}>
              Go to account
            </a>
          </>
        ) : (
          <p className="hs-copy" style={{ margin: 0 }}>
            {status}
          </p>
        )}
      </section>
    </main>
  );
}