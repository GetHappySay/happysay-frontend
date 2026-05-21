'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FeedbackRatePage() {
  return (
    <Suspense fallback={<FeedbackRateLoading />}>
      <FeedbackRateContent />
    </Suspense>
  );
}

function FeedbackRateLoading() {
  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />
        <p className="hs-copy">Loading feedback form...</p>
      </div>
    </main>
  );
}

function FeedbackRateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const buildPath = (path: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();

    const locationId = searchParams.get('locationId');
    const shortcode = searchParams.get('shortcode');
    const v = searchParams.get('v');
    const source = searchParams.get('source');

    if (locationId) params.set('locationId', locationId);
    if (shortcode) params.set('shortcode', shortcode);
    if (v) params.set('v', v);
    if (source) params.set('source', source);

    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        params.set(key, value);
      });
    }

    return `${path}?${params.toString()}`;
  };

  const handleRatingClick = (rating: number) => {
    if (rating <= 3) {
      router.push(buildPath('/feedback/low', { stars: String(rating) }));
      return;
    }

    if (rating === 4) {
      router.push(buildPath('/feedback/4'));
      return;
    }

    router.push(buildPath('/feedback/thanks'));
  };

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />

        <h2 className="hs-title">How was your experience?</h2>

        <div className="hs-stars">
          {[1, 2, 3, 4, 5].map((rating) => {
            const active = hoveredRating >= rating;

            return (
              <button
                key={rating}
                onClick={() => handleRatingClick(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                className={`hs-star-button ${active ? 'is-active' : ''}`}
                aria-label={`Rate ${rating} stars`}
              >
                ★
              </button>
            );
          })}
        </div>

        <p className="hs-subtext">Tap a star to leave your feedback</p>
      </div>
    </main>
  );
}