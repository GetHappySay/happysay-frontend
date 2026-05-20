'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type LocationConfig = {
  id: string;
  name: string;
  businessName?: string | null;
  shortcode?: string | null;
  googleReviewUrl?: string | null;
};

function fallbackReviewUrl() {
  return 'https://www.google.com/search?q=leave+a+review';
}

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const [reviewUrl, setReviewUrl] = useState(fallbackReviewUrl());
  const [isLoadingReviewUrl, setIsLoadingReviewUrl] = useState(true);

  useEffect(() => {
    async function loadLocation() {
      const locationId = searchParams.get('locationId');

      if (!locationId) {
        setIsLoadingReviewUrl(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/public/location/${encodeURIComponent(locationId)}`);

        if (!res.ok) {
          throw new Error('Failed to fetch location');
        }

        const data: LocationConfig = await res.json();

        if (data.googleReviewUrl) {
          setReviewUrl(data.googleReviewUrl);
        }
      } catch (err) {
        console.error('Failed to load Google review URL:', err);
        setReviewUrl(fallbackReviewUrl());
      } finally {
        setIsLoadingReviewUrl(false);
      }
    }

    loadLocation();
  }, [searchParams]);

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />

        <h2 className="hs-title">We’re listening.</h2>

        <p className="hs-copy">Thanks for your feedback. It’s already been sent to the team.</p>

        <p className="hs-copy">
          We hope to resolve this directly, but if you&apos;d still like to post a review on Google,
          you can do so here:
        </p>

        <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="hs-review-button">
          <span className="hs-button-content">
            {isLoadingReviewUrl ? (
              <>
                <span className="hs-spinner" />
                Loading review link...
              </>
            ) : (
              'Leave a Google review anyway'
            )}
          </span>
        </a>

        <p className="hs-disclaimer" style={{ marginTop: '32px' }}>
          You’re always in control. We never block reviews. We just want to hear you out first.
        </p>
      </div>
    </main>
  );
}