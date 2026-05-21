'use client';

import { Suspense, useEffect, useState } from 'react';
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

function makeIdempotencyKey({
  stars,
  locationId,
  comment,
}: {
  stars: number;
  locationId: string;
  comment?: string;
}) {
  const safeComment = String(comment || '').trim().toLowerCase();
  return `feedback:${locationId}:${stars}:positive:${safeComment || 'pageview'}`;
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksLoading />}>
      <ThanksContent />
    </Suspense>
  );
}

function ThanksLoading() {
  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" alt="HappySay Logo" className="hs-logo" />
        <p className="hs-copy">Loading...</p>
      </div>
    </main>
  );
}

function ThanksContent() {
  const searchParams = useSearchParams();

  const [reviewUrl, setReviewUrl] = useState(fallbackReviewUrl());
  const [isLoadingReviewUrl, setIsLoadingReviewUrl] = useState(true);
  const [note, setNote] = useState('');
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const locationId = searchParams.get('locationId');
  const shortcode = searchParams.get('shortcode');
  const v = searchParams.get('v');
  const source = searchParams.get('source');
  const fromPositiveFourStar = searchParams.get('from') === 'positive_4star';

  useEffect(() => {
    async function loadLocation() {
      if (!locationId) {
        setIsLoadingReviewUrl(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/public/location/${encodeURIComponent(locationId)}`,
        );

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

    async function logFiveStarPageview() {
      if (!locationId || fromPositiveFourStar) return;

      try {
        await fetch(`${API_BASE}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': makeIdempotencyKey({ stars: 5, locationId }),
          },
          body: JSON.stringify({
            stars: 5,
            comment: '',
            contact: '',
            optIn: false,
            locationId,
            ...(shortcode ? { shortcode } : {}),
            ...(v ? { v } : {}),
            ...(source ? { source } : {}),
          }),
        });
      } catch (err) {
        console.error('Failed to log 5-star feedback:', err);
      }
    }

    loadLocation();
    logFiveStarPageview();
  }, [locationId, shortcode, v, source, fromPositiveFourStar]);

  async function handleSendNote() {
    if (isSavingNote) return;

    setNoteError('');

    const cleanNote = note.trim();

    if (!locationId) {
      setNoteError('Something went wrong loading this business. Please scan the code again.');
      return;
    }

    if (!cleanNote) {
      setNoteError('Write a quick note before sending.');
      return;
    }

    setIsSavingNote(true);

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': makeIdempotencyKey({
            stars: 5,
            locationId,
            comment: cleanNote,
          }),
        },
        body: JSON.stringify({
          stars: 5,
          comment: cleanNote,
          contact: '',
          optIn: false,
          locationId,
          ...(shortcode ? { shortcode } : {}),
          ...(v ? { v } : {}),
          ...(source ? { source } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send note');
      }

      setNote('');
      setNoteSubmitted(true);
    } catch (err) {
      console.error('Failed to send 5-star note:', err);
      setNoteError('Something went wrong sending your note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  }

  return (
    <main className="hs-page">
      <div
        className="hs-card"
        style={{
          maxWidth: '460px',
          padding: '38px 36px',
        }}
      >
        <img
          src="/logo.svg"
          alt="HappySay Logo"
          className="hs-logo"
          style={{ marginBottom: '22px' }}
        />

        <h2 className="hs-title" style={{ marginBottom: '8px' }}>
          {noteSubmitted || fromPositiveFourStar
            ? 'Thanks for sharing your feedback.'
            : 'Thanks for the feedback.'}
        </h2>

        <p className="hs-copy" style={{ marginBottom: '18px' }}>
          {noteSubmitted || fromPositiveFourStar
            ? "If you'd like, you can also share your experience on Google."
            : 'Want to share anything about your experience?'}
        </p>

        {!fromPositiveFourStar && !noteSubmitted && (
          <div className="hs-form" style={{ gap: '12px' }}>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: Great experience, friendly team, quick service..."
              className="hs-textarea"
              rows={3}
              style={{
                minHeight: '104px',
              }}
            />

            {noteError ? <div className="hs-error">{noteError}</div> : null}

            <button
              type="button"
              onClick={handleSendNote}
              disabled={isSavingNote || !note.trim()}
              style={{
                border: '1px solid var(--hs-border)',
                background: 'white',
                color: 'var(--hs-navy)',
                borderRadius: '999px',
                padding: '11px 16px',
                fontWeight: 850,
                cursor: isSavingNote || !note.trim() ? 'not-allowed' : 'pointer',
                opacity: isSavingNote || !note.trim() ? 0.55 : 1,
              }}
            >
              {isSavingNote ? 'Sending...' : 'Send feedback only'}
            </button>
          </div>
        )}

        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hs-review-button"
          style={{
            marginTop: fromPositiveFourStar || noteSubmitted ? '10px' : '22px',
            width: '100%',
          }}
        >
          <span className="hs-button-content">
            {isLoadingReviewUrl ? (
              <>
                <span className="hs-spinner" />
                Loading review link...
              </>
            ) : (
              'Leave a Google review'
            )}
          </span>
        </a>
      </div>
    </main>
  );
}