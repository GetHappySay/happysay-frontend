'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type Message = {
  id: string;
  body: string;
  sender: string;
  channel?: string;
  createdAt: string;
};

type PublicThread = {
  id: string;
  status: string;
  archived?: boolean;
  businessName: string;
  feedback?: {
    stars: number | null;
    comment: string | null;
    createdAt: string;
  } | null;
  messages: Message[];
};

function formatTime(value?: string) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizeSender(sender: string) {
  return String(sender || '').toLowerCase() === 'business' ? 'business' : 'customer';
}

function getClosedCopy(reason?: string) {
  if (reason === 'expired') {
    return {
      title: 'This reply link has expired.',
      body: 'For your privacy, feedback reply links are only active for a limited time.',
    };
  }

  if (reason === 'resolved') {
    return {
      title: 'This conversation has been closed.',
      body: 'The business marked this feedback as resolved. If you still need help, contact the business directly.',
    };
  }

  if (reason === 'archived') {
    return {
      title: 'This conversation is no longer active.',
      body: 'This feedback thread is not accepting new replies right now.',
    };
  }

  return {
    title: 'This reply link is not available.',
    body: 'The link may be invalid or no longer active.',
  };
}

export default function ReplyThreadPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [thread, setThread] = useState<PublicThread | null>(null);
  const [available, setAvailable] = useState(true);
  const [blockedReason, setBlockedReason] = useState<string | undefined>();
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadThread() {
    try {
      setError('');

      const res = await fetch(`${API_BASE}/api/public/reply-thread/${token}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Failed to load conversation');

      if (!data.available) {
        setAvailable(false);
        setBlockedReason(data.reason);
        setThread(null);
        return;
      }

      setAvailable(true);
      setBlockedReason(undefined);
      setThread(data.thread);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
  }, [token]);

  const sortedMessages = useMemo(() => {
    return [...(thread?.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [thread]);

  async function sendReply() {
    if (sending || !replyText.trim()) return;

    setError('');
    setSuccess('');
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/public/reply-thread/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Failed to send reply');

      setReplyText('');
      setSuccess('Your reply was sent.');
      await loadThread();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  const closedCopy = getClosedCopy(blockedReason);

  return (
    <main
      className="hs-page"
      style={{
        alignItems: 'flex-start',
        padding: '20px 14px',
      }}
    >
      <section
        className="hs-card"
        style={{
          maxWidth: '640px',
          width: '100%',
          textAlign: 'left',
          padding: '20px 16px',
          borderRadius: '24px',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--hs-muted)',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            HappySay secure reply
          </p>

          {thread && (
            <>
              <h1 className="hs-title" style={{ margin: 0, fontSize: '24px' }}>
                {thread.businessName} responded to your feedback.
              </h1>

              <p className="hs-disclaimer" style={{ margin: '10px 0 0' }}>
                This is a direct conversation with {thread.businessName}.
              </p>
            </>
          )}
        </div>

        {loading ? (
          <p className="hs-copy" style={{ textAlign: 'left', margin: 0 }}>
            Loading conversation...
          </p>
        ) : !available ? (
          <ClosedState title={closedCopy.title} body={closedCopy.body} />
        ) : error && !thread ? (
          <div className="hs-error">{error}</div>
        ) : thread ? (
          <>
            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '18px',
                padding: '16px',
                background: '#FBFAF7',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  color: 'var(--hs-muted)',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                Your original feedback
              </p>

              <strong style={{ color: 'var(--hs-text)', fontSize: '17px' }}>
                {thread.feedback?.stars || '?'}★ feedback
              </strong>

              <p
                style={{
                  margin: '8px 0 0',
                  color: 'var(--hs-text)',
                  lineHeight: 1.5,
                  fontWeight: 700,
                  fontSize: '15px',
                }}
              >
                {thread.feedback?.comment || 'No written feedback provided.'}
              </p>

              <p className="hs-disclaimer" style={{ margin: '10px 0 0' }}>
                {formatTime(thread.feedback?.createdAt)}
              </p>
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '18px',
                background: 'white',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--hs-border)' }}>
                <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--hs-text)' }}>
                  Conversation
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '14px', padding: '16px' }}>
                {sortedMessages.map((message) => {
                  const isBusiness = normalizeSender(message.sender) === 'business';

                  return (
                    <article
                      key={message.id}
                      style={{
                        border: '1px solid var(--hs-border)',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        background: isBusiness ? '#FFFBEB' : '#FBFDFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '10px',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ fontSize: '13px', color: 'var(--hs-navy)' }}>
                          {isBusiness ? thread.businessName : 'You'}
                        </strong>

                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--hs-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          color: 'var(--hs-text)',
                          lineHeight: 1.5,
                          fontSize: '15px',
                        }}
                      >
                        {message.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '18px',
                padding: '16px',
                background: 'white',
              }}
            >
              <h2 style={{ margin: '0 0 6px', fontSize: '17px', color: 'var(--hs-text)' }}>
                Send a reply
              </h2>

              <p className="hs-disclaimer" style={{ margin: '0 0 12px' }}>
                Your message goes directly back to {thread.businessName}.
              </p>

              {error && <div className="hs-error" style={{ marginBottom: '12px' }}>{error}</div>}

              {success && (
                <div
                  style={{
                    border: '1px solid #ABEFC6',
                    background: '#ECFDF3',
                    color: '#067647',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    marginBottom: '12px',
                  }}
                >
                  {success}
                </div>
              )}

              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write your reply..."
                className="hs-textarea"
                rows={4}
                maxLength={1200}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  marginBottom: '12px',
                  minHeight: '120px',
                }}
              />

              <p className="hs-disclaimer" style={{ margin: '0 0 12px' }}>
                Include any details that help the business understand what happened.
              </p>

              <button
                type="button"
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="hs-button"
                style={{
                  width: '100%',
                  borderRadius: '999px',
                  opacity: sending || !replyText.trim() ? 0.7 : 1,
                }}
              >
                <span className="hs-button-content">
                  {sending ? 'Sending...' : 'Send reply'}
                </span>
              </button>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function ClosedState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '18px',
        padding: '20px',
        background: '#FBFAF7',
        textAlign: 'center',
      }}
    >
      <h1 className="hs-title" style={{ margin: '0 0 10px', fontSize: '24px' }}>
        {title}
      </h1>

      <p className="hs-copy" style={{ margin: 0 }}>
        {body}
      </p>
    </div>
  );
}