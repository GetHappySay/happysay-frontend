'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type FeedbackResponse = {
  success?: boolean;
  error?: string;
  nextStep?: 'thanks' | 'confirm' | 'rate';
  routedTo?: 'google' | 'inbox' | 'rate';
  from?: string;
  feedbackId?: string;
};

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

export default function LowStarFeedbackPage() {
  return (
    <Suspense fallback={<LowStarLoading />}>
      <LowStarFeedbackContent />
    </Suspense>
  );
}

function LowStarLoading() {
  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />
        <p className="hs-copy">Loading feedback form...</p>
      </div>
    </main>
  );
}

function LowStarFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [comment, setComment] = useState('');
  const [contact, setContact] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const buildPath = (path: string) => {
    const params = new URLSearchParams();

    const locationId = searchParams.get('locationId');
    const shortcode = searchParams.get('shortcode');
    const v = searchParams.get('v');
    const source = searchParams.get('source');
    const stars = searchParams.get('stars');

    if (locationId) params.set('locationId', locationId);
    if (shortcode) params.set('shortcode', shortcode);
    if (v) params.set('v', v);
    if (source) params.set('source', source);
    if (stars) params.set('stars', stars);

    return `${path}?${params.toString()}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError('');

    const locationId = searchParams.get('locationId');
    const shortcode = searchParams.get('shortcode');
    const v = searchParams.get('v');
    const source = searchParams.get('source');
    const stars = Number(searchParams.get('stars') || '1');

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
        stars,
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
          stars,
          comment,
          contact: contact || '',
          optIn: contact && optIn ? true : false,
          locationId,
          ...(shortcode ? { shortcode } : {}),
          ...(v ? { v } : {}),
          ...(source ? { source } : {}),
        }),
      });

      const data: FeedbackResponse = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Feedback submission failed');
      }

      router.push(buildPath('/feedback/confirm'));
    } catch (err) {
      console.error('❌ Failed to submit feedback:', err);
      setError('Something went wrong sending your feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />

        <h2 className="hs-title">We&apos;re really sorry to hear that.</h2>

        <p className="hs-copy">Can you tell us what went wrong?</p>

        <div className="hs-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave your feedback here..."
            className="hs-textarea"
          />

          <label htmlFor="phone" className="hs-label">
            Phone number
          </label>

          <input
            id="phone"
            name="contact"
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+1 313 555 0123"
            className="hs-input"
          />

          <label htmlFor="sms-consent" className="hs-checkbox">
            <input
              id="sms-consent"
              name="consent"
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
            />
            <span>
              Yes, I agree to receive a one-time SMS from HappySay about my feedback and
              experience. Standard message & data rates may apply. Reply <strong>STOP</strong>{' '}
              to opt out. <strong>HELP</strong> for help.
            </span>
          </label>

          <p className="hs-terms">
            By submitting, you agree to HappySay&apos;s{' '}
            <a
              href="https://gethappysay.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="hs-link"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://gethappysay.com/terms"
              target="_blank"
              rel="noreferrer"
              className="hs-link"
            >
              Terms
            </a>
            .
          </p>

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