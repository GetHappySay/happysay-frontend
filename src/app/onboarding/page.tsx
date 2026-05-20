'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN!;

type ProvisionResult = {
  location: {
    id: string;
    name: string;
    businessName: string;
    shortcode: string;
    apiKey: string;
    googleReviewUrl: string;
    tier: string;
  };
  links: {
    feedbackLink: string;
    qrImageUrl: string;
  };
  zapier: {
    header: string;
    apiKey: string;
    locationId: string;
  };
};

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('restaurant');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [tier, setTier] = useState('Core');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const handleCreateLocation = async () => {
    if (isSubmitting) return;

    setError('');
    setCopied('');
    setResult(null);

    if (!ADMIN_TOKEN) {
      setError('Internal access is not configured.');
      return;
    }

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    if (!googleReviewUrl.trim()) {
      setError('Google review URL is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          businessName,
          industry,
          googleReviewUrl,
          tier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create location');
      }

      setResult(data);
    } catch (err) {
      console.error('❌ Failed to create location:', err);
      setError(err instanceof Error ? err.message : 'Failed to create location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1400);
  };

  const qrImageUrl = result
    ? `${API_BASE.replace(/\/$/, '')}/api/qr/${result.location.shortcode}`
    : '';

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />

        <h1 className="hs-title">Set up your location</h1>

        <p className="hs-copy">
          Create a business, generate its feedback link, QR code, and integration key.
        </p>

        <div className="hs-form">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            className="hs-input"
          />

          <input
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="Google review URL"
            className="hs-input"
          />

          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="hs-input">
            <option value="restaurant">Restaurant</option>
            <option value="bar">Bar</option>
            <option value="salon">Salon</option>
            <option value="fitness">Fitness</option>
            <option value="retail">Retail</option>
            <option value="service">Service Business</option>
            <option value="general">General</option>
          </select>

          <select value={tier} onChange={(e) => setTier(e.target.value)} className="hs-input">
            <option value="Core">Core</option>
            <option value="Smart">Smart</option>
            <option value="Pro">Pro</option>
          </select>

          {error ? <div className="hs-error">{error}</div> : null}

          <button onClick={handleCreateLocation} disabled={isSubmitting} className="hs-button">
            <span className="hs-button-content">
              {isSubmitting ? (
                <>
                  <span className="hs-spinner" />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </span>
          </button>
        </div>

        {result ? (
          <div style={{ marginTop: '30px', textAlign: 'left' }}>
            <h2 className="hs-title" style={{ fontSize: '18px', marginBottom: '10px' }}>
              Business created
            </h2>

            <p className="hs-copy" style={{ textAlign: 'left', marginBottom: '18px' }}>
              {result.location.businessName} is ready to collect feedback.
            </p>

            <a
              href={result.links.feedbackLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hs-review-button"
              style={{ width: '100%', textAlign: 'center', marginTop: 0, marginBottom: '18px' }}
            >
              Open Feedback Page
            </a>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src={qrImageUrl}
                alt="Generated QR code"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '16px',
                  border: '1px solid var(--hs-border)',
                  background: 'white',
                  padding: '10px',
                }}
              />
            </div>

            <ResultRow label="Feedback Link" value={result.links.feedbackLink} copied={copied} onCopy={copy} />
            <ResultRow label="QR Image URL" value={qrImageUrl} copied={copied} onCopy={copy} />
            <ResultRow label="Location ID" value={result.location.id} copied={copied} onCopy={copy} />
            <ResultRow label="API Key" value={result.location.apiKey} copied={copied} onCopy={copy} />

            <p className="hs-disclaimer" style={{ marginTop: '20px' }}>
              Keep the API key secure. Use it only for POS, Zapier, or automation triggers.
            </p>
          </div>
        ) : null}
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <input value={value} readOnly className="hs-input" style={{ fontSize: '12px' }} />

        <button
          type="button"
          onClick={() => onCopy(label, value)}
          className="hs-button"
          style={{
            width: 'auto',
            padding: '0 14px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}