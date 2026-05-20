'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type Plan = {
  tier: string;
  label: string;
};

type Features = {
  urgencyAI?: boolean;
  aiSummary?: boolean;
  aiReplyDrafts?: boolean;
};

type Message = {
  id: string;
  body: string;
  sender: string;
  channel?: string;
  aiSummary?: string | null;
  createdAt: string;
};

type Thread = {
  id: string;
  status: string;
  archived?: boolean;
  messages: Message[];
  feedbacks: {
    stars: number | null;
    comment?: string | null;
    contactInfo: string | null;
    urgencyScore: number | null;
    sentiment: string | null;
    createdAt?: string;
  }[];
};

function formatTime(value?: string) {
  if (!value) return 'Unknown time';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function urgencyLabel(score: number) {
  if (score >= 85) return 'Emergency';
  if (score >= 60) return 'Urgent';
  return 'Normal';
}

function normalizeSender(sender: string) {
  const normalized = sender?.toLowerCase();

  if (normalized === 'business' || normalized === 'owner' || normalized === 'staff') {
    return 'business';
  }

  return 'customer';
}

function formatStars(stars?: number | null) {
  if (!stars) return 'Feedback';
  return `${stars}-star feedback`;
}

export default function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const router = useRouter();
  const { threadId } = use(params);

  const [thread, setThread] = useState<Thread | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Features>({});
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const canSeeUrgency = Boolean(features.urgencyAI);
  const canSeeAiSummary = Boolean(features.aiSummary);
  const canUseAiDrafts = Boolean(features.aiReplyDrafts);

  async function loadThread() {
    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) throw new Error('Please log in again.');

      const res = await fetch(`${API_BASE}/api/customer/inbox/${threadId}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-store',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load feedback');
      }

      setThread(data.thread);
      setPlan(data.plan || null);
      setFeatures(data.features || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
    }
  }

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const feedback = thread?.feedbacks?.[0];
  const urgency = feedback?.urgencyScore ?? 0;
  const isResolved = thread?.status === 'resolved';
  const isArchived = Boolean(thread?.archived);
  const hasContact = Boolean(feedback?.contactInfo?.startsWith('+'));

  const sortedMessages = useMemo(() => {
    return [...(thread?.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [thread]);

  const customerMessages = sortedMessages.filter(
    (message) => normalizeSender(message.sender) === 'customer',
  );

  const latestCustomerMessage = [...customerMessages].reverse()[0];

  const customerFeedback =
    feedback?.comment || latestCustomerMessage?.body || 'No written feedback provided.';

  async function sendReply() {
    if (isSending || !replyText.trim() || isResolved || isArchived) return;

    setError('');
    setIsSending(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) throw new Error('Please log in again.');

      const res = await fetch(`${API_BASE}/api/customer/inbox/${threadId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyText.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Failed to send reply');

      setReplyText('');
      await loadThread();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  }

  async function markResolved() {
    if (isResolving || isResolved || isArchived) return;

    setError('');
    setIsResolving(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) throw new Error('Please log in again.');

      const res = await fetch(`${API_BASE}/api/customer/inbox/${threadId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || 'Failed to mark as resolved');

      router.push('/inbox');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as resolved');
    } finally {
      setIsResolving(false);
    }
  }

  async function archiveThread() {
    if (isArchiving || isArchived) return;

    setError('');
    setIsArchiving(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) throw new Error('Please log in again.');

      const res = await fetch(`${API_BASE}/api/customer/inbox/${threadId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || 'Failed to archive feedback');

      router.push('/inbox');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to archive feedback');
    } finally {
      setIsArchiving(false);
    }
  }

  async function restoreThread() {
    if (isRestoring || !isArchived) return;

    setError('');
    setIsRestoring(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) throw new Error('Please log in again.');

      const res = await fetch(`${API_BASE}/api/customer/inbox/${threadId}/unarchive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || 'Failed to restore feedback');

      await loadThread();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to restore feedback');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '920px',
          width: '100%',
          textAlign: 'left',
          padding: '34px',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/inbox')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            marginBottom: '22px',
            color: 'var(--hs-navy)',
            fontSize: '14px',
            fontWeight: 850,
            cursor: 'pointer',
          }}
        >
          ← Back to inbox
        </button>

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {!thread ? (
          <p className="hs-copy" style={{ textAlign: 'left' }}>
            Loading conversation...
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '26px' }}>
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '18px',
              }}
            >
              <div>
                <p
                  style={{
                    margin: '0 0 8px',
                    color: 'var(--hs-muted)',
                    fontSize: '14px',
                    fontWeight: 800,
                  }}
                >
                </p>

                <h1 className="hs-title" style={{ margin: 0 }}>
                  {formatStars(feedback?.stars)}
                </h1>

                <p
                  className="hs-copy"
                  style={{
                    textAlign: 'left',
                    margin: '10px 0 0',
                    maxWidth: '620px',
                  }}
                >
                  See what happened and respond if needed.
                </p>
              </div>

              <StatusBadge
                isResolved={isResolved}
                isArchived={isArchived}
                canSeeUrgency={canSeeUrgency}
                urgency={urgency}
                canReply={hasContact}
              />
            </header>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '24px',
                background: 'white',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px',
                  color: 'var(--hs-muted)',
                  fontSize: '13px',
                  fontWeight: 850,
                }}
              >
                What the customer said
              </p>

              <blockquote
                style={{
                  margin: 0,
                  padding: 0,
                  color: 'var(--hs-text)',
                  fontSize: '24px',
                  lineHeight: 1.35,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                “{customerFeedback}”
              </blockquote>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  marginTop: '22px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--hs-border)',
                }}
              >
                <MetaItem label="Contact" value={feedback?.contactInfo || 'No contact'} />
                <MetaItem label="Received" value={formatTime(feedback?.createdAt)} />

                {canSeeUrgency && (
                  <MetaItem label="Priority" value={`${urgencyLabel(urgency)} · ${urgency}`} />
                )}

                {canSeeUrgency && feedback?.sentiment && (
                  <MetaItem label="Sentiment" value={feedback.sentiment} />
                )}
              </div>
            </section>

            {canSeeAiSummary && latestCustomerMessage?.aiSummary && (
              <section
                style={{
                  border: '1px solid var(--hs-border)',
                  borderRadius: '22px',
                  padding: '18px',
                  background: '#FBFAF7',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px',
                    color: 'var(--hs-muted)',
                    fontSize: '13px',
                    fontWeight: 850,
                  }}
                >
                  Summary
                </p>

                <p style={{ margin: 0, color: 'var(--hs-text)', lineHeight: 1.55 }}>
                  {latestCustomerMessage.aiSummary}
                </p>
              </section>
            )}

            <section>
              <h2
                style={{
                  margin: '0 0 12px',
                  color: 'var(--hs-text)',
                  fontSize: '20px',
                  letterSpacing: '-0.02em',
                }}
              >
                Conversation
              </h2>

              <div
                style={{
                  border: '1px solid var(--hs-border)',
                  borderRadius: '24px',
                  background: 'white',
                  overflow: 'hidden',
                }}
              >
                {sortedMessages.length === 0 ? (
                  <p className="hs-copy" style={{ margin: 0, padding: '22px', textAlign: 'left' }}>
                    No messages yet.
                  </p>
                ) : (
                  sortedMessages.map((msg) => {
                    const isBusiness = normalizeSender(msg.sender) === 'business';

                    return (
                      <article
                        key={msg.id}
                        style={{
                          padding: '18px 20px',
                          borderBottom: '1px solid var(--hs-border)',
                          background: isBusiness ? '#FFFCF2' : 'white',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '14px',
                            marginBottom: '8px',
                          }}
                        >
                          <strong
                            style={{
                              color: isBusiness ? '#7A4E00' : 'var(--hs-navy)',
                              fontSize: '13px',
                            }}
                          >
                            {isBusiness ? 'Your response' : 'Customer'}
                          </strong>

                          <span
                            style={{
                              color: 'var(--hs-muted)',
                              fontSize: '12px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color: 'var(--hs-text)',
                            lineHeight: 1.55,
                            fontSize: '16px',
                          }}
                        >
                          {msg.body}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '22px',
                background: isResolved || isArchived ? '#F8FAFC' : 'white',
              }}
            >
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--hs-text)' }}>
                Reply
              </h2>

              {isArchived ? (
                <LockedNotice
                  title="This conversation is archived."
                  body="Restore it before replying or making changes."
                />
              ) : isResolved ? (
                <LockedNotice
                  title="This conversation is resolved."
                  body="Resolved conversations are locked from new replies for now."
                />
              ) : !hasContact ? (
                <LockedNotice
                  title="No reachable contact."
                  body="You can review the feedback, but SMS replies need an opted-in phone number."
                />
              ) : (
                <>
                  {canUseAiDrafts && (
                    <button
                      type="button"
                      style={{
                        border: '1px solid var(--hs-border)',
                        background: '#FBFAF7',
                        color: 'var(--hs-text)',
                        borderRadius: '999px',
                        padding: '10px 14px',
                        fontWeight: 850,
                        cursor: 'pointer',
                        marginBottom: '12px',
                      }}
                    >
                      Draft a reply
                    </button>
                  )}

                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Example: Thanks for letting us know. I’m sorry this happened, and I’d like to make it right."
                    className="hs-textarea"
                    rows={4}
                    style={{
                      width: '100%',
                      marginBottom: '14px',
                      resize: 'vertical',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={markResolved}
                        disabled={isResolving}
                        style={{
                          border: '1px solid #ABEFC6',
                          background: '#ECFDF3',
                          color: '#067647',
                          borderRadius: '999px',
                          padding: '11px 16px',
                          fontWeight: 850,
                          cursor: isResolving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isResolving ? 'Resolving...' : 'Mark resolved'}
                      </button>

                      <button
                        type="button"
                        onClick={archiveThread}
                        disabled={isArchiving}
                        style={{
                          border: '1px solid var(--hs-border)',
                          background: 'white',
                          color: 'var(--hs-muted)',
                          borderRadius: '999px',
                          padding: '11px 16px',
                          fontWeight: 850,
                          cursor: isArchiving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isArchiving ? 'Archiving...' : 'Archive'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={isSending || !replyText.trim()}
                      className="hs-button"
                      style={{
                        width: 'auto',
                        minWidth: '150px',
                        opacity: isSending || !replyText.trim() ? 0.7 : 1,
                      }}
                    >
                      <span className="hs-button-content">
                        {isSending ? 'Sending...' : 'Send reply'}
                      </span>
                    </button>
                  </div>
                </>
              )}

              {isArchived && (
                <button
                  type="button"
                  onClick={restoreThread}
                  disabled={isRestoring}
                  className="hs-button"
                  style={{ marginTop: '14px' }}
                >
                  <span className="hs-button-content">
                    {isRestoring ? 'Restoring...' : 'Restore conversation'}
                  </span>
                </button>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({
  isResolved,
  isArchived,
  canSeeUrgency,
  urgency,
  canReply,
}: {
  isResolved: boolean;
  isArchived: boolean;
  canSeeUrgency: boolean;
  urgency: number;
  canReply: boolean;
}) {
  let label = canReply ? 'Needs response' : 'Review only';
  let background = canReply ? '#FFFAEB' : '#F2F4F7';
  let color = canReply ? '#B54708' : '#475467';

  if (isResolved) {
    label = 'Resolved';
    background = '#ECFDF3';
    color = '#067647';
  } else if (isArchived) {
    label = 'Archived';
    background = '#F2F4F7';
    color = '#475467';
  } else if (canReply && canSeeUrgency && urgency >= 60) {
    label = urgencyLabel(urgency);
    background = urgency >= 85 ? '#FEF3F2' : '#FFFAEB';
    color = urgency >= 85 ? '#B42318' : '#B54708';
  }

  return (
    <span
      style={{
        borderRadius: '999px',
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: 850,
        background,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: '140px' }}>
      <p
        style={{
          margin: '0 0 4px',
          color: 'var(--hs-muted)',
          fontSize: '12px',
          fontWeight: 850,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          color: 'var(--hs-text)',
          fontSize: '14px',
          fontWeight: 750,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function LockedNotice({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '18px',
        padding: '16px',
        background: 'white',
      }}
    >
      <strong style={{ color: 'var(--hs-text)' }}>{title}</strong>
      <p className="hs-disclaimer" style={{ margin: '6px 0 0' }}>
        {body}
      </p>
    </div>
  );
}