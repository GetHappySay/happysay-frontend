'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

function makeIdempotencyKey({
  stars,
  comment,
  contact,
  locationId,
}: {
  stars: number;
  comment: string;
  contact: string;
  locationId: string;
}) {
  const safeComment = String(comment || '').trim().toLowerCase();
  const safeContact = String(contact || '').trim().toLowerCase();
  return `feedback:${locationId}:${stars}:${safeContact}:${safeComment}`;
}

export default function FourStarFeedbackPage() {
  return (
    <Suspense fallback={<FeedbackLoading />}>
      <FourStarFeedbackContent />
    </Suspense>
  );
}

function FeedbackLoading() {
  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />
        <p className="hs-copy">Loading feedback form...</p>
      </div>
    </main>
  );
}

function FourStarFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [comment, setComment] = useState('');
  const [contact, setContact] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        if (value) params.set(key, value);
      });
    }

    return `${path}?${params.toString()}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError('');

    const locationId = searchParams.get('locationId');
    const shortcode = searchParams.get('shortcode');
    const v = searchParams.get('v');
    const source = searchParams.get('source');

    if (!locationId) {
      setError('Something went wrong loading this business. Please scan the code again.');
      return;
    }

    if (!comment.trim()) {
      setError('Please tell us what happened before sending.');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = makeIdempotencyKey({
        stars: 4,
        comment,
        contact,
        locationId,
      });

      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          stars: 4,
          comment,
          contact,
          optIn,
          locationId,
          ...(shortcode ? { shortcode } : {}),
          ...(v ? { v } : {}),
          ...(source ? { source } : {}),
        }),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error('Feedback submission failed');
      }

      const finalUrl = response.url || '';
      let backendFrom = '';

      try {
        backendFrom = new URL(finalUrl).searchParams.get('from') || '';
      } catch {
        backendFrom = '';
      }

      if (finalUrl.includes('/five-stars.html') || finalUrl.includes('/feedback/thanks')) {
        router.push(
          buildPath(
            '/feedback/thanks',
            backendFrom ? { from: backendFrom } : { from: 'positive_4star' },
          ),
        );
        return;
      }

      if (
        finalUrl.includes('/low-star-confirmation.html') ||
        finalUrl.includes('/feedback/confirm')
      ) {
        router.push(buildPath('/feedback/confirm'));
        return;
      }

      setError('We received your feedback, but the next step did not load. Please try again.');
      setIsSubmitting(false);
    } catch (err) {
      console.error('❌ Failed to submit 4-star feedback:', err);
      setError('Something went wrong sending your feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />

        <h2 className="hs-title">Thanks for your feedback.</h2>

        <p className="hs-copy">Want to tell us what could’ve made it 5 stars?</p>

        <div className="hs-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave your feedback here..."
            className="hs-textarea"
          />

          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone (optional)"
            className="hs-input"
          />

          <label htmlFor="consent" className="hs-checkbox">
            <input
              id="consent"
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
            />
            <span>Yes, you can reach out to me</span>
          </label>

          {error ? <div className="hs-error">{error}</div> : null}

          <button onClick={handleSubmit} disabled={isSubmitting} className="hs-button">
            <span className="hs-button-content">
              {isSubmitting ? (
                <>
                  <span className="hs-spinner" />
                  Sending...
                </>
              ) : (
                'Send Feedback'
              )}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}