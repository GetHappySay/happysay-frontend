'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type LocationData = {
  id: string;
  businessName: string;
  shortcode: string;
  apiKey: string;
};

export default function OnboardingSuccessPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let objectUrl = '';

    async function loadLocation() {
      try {
        const token = localStorage.getItem('happysay_token');

        if (!token) {
          throw new Error('Not authenticated. Please log in again.');
        }

        const res = await fetch(`${API_BASE}/api/public/location/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load location');
        }

        setLocation(data);

        const qrRes = await fetch(`${API_BASE}/api/qr/${data.shortcode}`, {
          cache: 'no-store',
        });

        if (!qrRes.ok) {
          throw new Error('QR failed to load');
        }

        const blob = await qrRes.blob();
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
      } catch (err: any) {
        setError(err.message);
      }
    }

    loadLocation();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  };

  const feedbackLink = location ? `${window.location.origin}/r/${location.shortcode}` : '';

  const qrImageUrl = location ? `${API_BASE}/api/qr/${location.shortcode}` : '';

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" className="hs-logo" alt="HappySay Logo" />

        <h1 className="hs-title">You’re live</h1>

        <p className="hs-copy">Your feedback system is ready. Start collecting reviews now.</p>

        {error && <div className="hs-error">{error}</div>}

        {!location ? (
          <p className="hs-copy">Loading...</p>
        ) : (
          <>
            <a
              href={feedbackLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hs-review-button"
              style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}
            >
              Open Feedback Page
            </a>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  style={{
                    width: '180px',
                    height: '180px',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid var(--hs-border)',
                  }}
                />
              ) : (
                <p className="hs-copy">Loading QR...</p>
              )}
            </div>

            <ResultRow label="Feedback Link" value={feedbackLink} copied={copied} onCopy={copy} />
            <ResultRow label="QR Image URL" value={qrImageUrl} copied={copied} onCopy={copy} />
            <ResultRow label="Location ID" value={location.id} copied={copied} onCopy={copy} />
            <ResultRow label="API Key" value={location.apiKey} copied={copied} onCopy={copy} />

            <p className="hs-disclaimer" style={{ marginTop: '20px' }}>
              Save this. You’ll use it for POS, Zapier, and automation.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function ResultRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div className="hs-label" style={{ marginBottom: '6px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={value} readOnly className="hs-input" style={{ fontSize: '12px' }} />

        <button
          onClick={() => onCopy(label, value)}
          className="hs-button"
          style={{
            width: 'auto',
            padding: '0 14px',
            fontSize: '13px',
          }}
        >
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}