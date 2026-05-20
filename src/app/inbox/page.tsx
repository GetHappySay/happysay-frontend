'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type Plan = {
  tier: string;
  label: string;
  monthlyPrice?: number;
  smsIncluded?: number;
  locationLimit?: number | null;
};

type Features = {
  urgencyAI?: boolean;
  aiSummary?: boolean;
  aiReplyDrafts?: boolean;
  googleReviewReplies?: boolean;
  expandedAnalytics?: boolean;
  advancedAnalytics?: boolean;
};

type Thread = {
  id: string;
  status: string;
  archived?: boolean;
  urgencyScore?: number | null;
  lastMessageAt?: string | null;
  lastCustomerReply?: string | null;
  feedbacks: {
    stars: number | null;
    comment: string | null;
    contactInfo: string | null;
    urgencyScore: number | null;
    sentiment: string | null;
    createdAt: string;
  }[];
  messages: {
    body: string;
    sender: string;
    channel?: string;
    createdAt: string;
    aiSummary?: string | null;
  }[];
};

type InboxTab = 'open' | 'urgent' | 'resolved' | 'archived';

function getUrgencyLabel(score: number) {
  if (score >= 85) return 'Emergency';
  if (score >= 60) return 'Urgent';
  return 'Normal';
}

function getRelativeTime(value?: string | null) {
  if (!value) return 'No recent activity';

  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getLatestMessage(thread: Thread) {
  return thread.messages?.[0] || null;
}

function getThreadIssue(thread: Thread) {
  const feedback = thread.feedbacks?.[0];
  const latestMessage = getLatestMessage(thread);

  if (latestMessage?.sender?.toLowerCase() === 'customer') {
    return latestMessage.body;
  }

  return feedback?.comment || latestMessage?.body || 'No written feedback provided.';
}

function getThreadUrgency(thread: Thread) {
  const feedback = thread.feedbacks?.[0];
  return feedback?.urgencyScore ?? thread.urgencyScore ?? 0;
}

function getThreadStars(thread: Thread) {
  return thread.feedbacks?.[0]?.stars ?? null;
}

function getThreadContact(thread: Thread) {
  return thread.feedbacks?.[0]?.contactInfo || 'No contact provided';
}

function getThreadTime(thread: Thread) {
  return thread.lastMessageAt || thread.feedbacks?.[0]?.createdAt;
}

function hasNewCustomerReply(thread: Thread) {
  const latestMessage = getLatestMessage(thread);
  return (
    Boolean(thread.lastCustomerReply) &&
    latestMessage?.sender?.toLowerCase() === 'customer' &&
    thread.status !== 'resolved' &&
    !thread.archived
  );
}

export default function InboxPage() {
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Features>({});
  const [activeTab, setActiveTab] = useState<InboxTab>('open');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canSeeUrgency = Boolean(features.urgencyAI);

  const loadInbox = useCallback(async ({ quiet = false }: { quiet?: boolean } = {}) => {
    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) {
        throw new Error('Please log in again.');
      }

      if (!quiet) setLoading(true);

      const res = await fetch(`${API_BASE}/api/customer/inbox`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-store',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load inbox');
      }

      setThreads(data.threads || []);
      setPlan(data.plan || null);
      setFeatures(data.features || {});
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadInbox({ quiet: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [loadInbox]);

  const stats = useMemo(() => {
    const activeThreads = threads.filter((thread) => !thread.archived);

    const open = activeThreads.filter((thread) => thread.status !== 'resolved').length;

    const urgent = activeThreads.filter((thread) => {
      const urgency = getThreadUrgency(thread);
      return canSeeUrgency && urgency >= 60 && thread.status !== 'resolved';
    }).length;

    const newReplies = activeThreads.filter(hasNewCustomerReply).length;
    const resolved = activeThreads.filter((thread) => thread.status === 'resolved').length;
    const archived = threads.filter((thread) => thread.archived).length;

    return { open, urgent, newReplies, resolved, archived };
  }, [threads, canSeeUrgency]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const urgency = getThreadUrgency(thread);

      if (activeTab === 'archived') return thread.archived === true;

      if (activeTab === 'urgent') {
        return canSeeUrgency && urgency >= 60 && thread.status !== 'resolved' && !thread.archived;
      }

      if (activeTab === 'resolved') {
        return thread.status === 'resolved' && !thread.archived;
      }

      return thread.status !== 'resolved' && !thread.archived;
    });
  }, [threads, activeTab, canSeeUrgency]);

  const needsAttention = filteredThreads.filter((thread) => {
    const urgency = getThreadUrgency(thread);
    return hasNewCustomerReply(thread) || (canSeeUrgency && urgency >= 60);
  });

  const regularThreads = filteredThreads.filter((thread) => {
    const urgency = getThreadUrgency(thread);
    return !hasNewCustomerReply(thread) && !(canSeeUrgency && urgency >= 60);
  });

  const headline =
    stats.newReplies > 0
      ? `${stats.newReplies} conversation${stats.newReplies === 1 ? '' : 's'} need${stats.newReplies === 1 ? 's' : ''} a response`
      : stats.open > 0
        ? `${stats.open} conversation${stats.open === 1 ? '' : 's'} to review`
        : 'You’re all caught up';

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
        <header style={{ marginBottom: '28px' }}>
          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--hs-muted)',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            Inbox
          </p>

          <h1 className="hs-title" style={{ margin: 0 }}>
            {headline}
          </h1>

          <p
            className="hs-copy"
            style={{
              textAlign: 'left',
              margin: '10px 0 0',
              maxWidth: '620px',
            }}
          >
            {stats.open > 0
              ? 'Open a conversation, reply when needed, and keep customers feeling heard.'
              : 'New feedback will appear here when it needs your attention.'}
          </p>
        </header>

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <InboxTabButton
            label="Open"
            count={stats.open}
            active={activeTab === 'open'}
            onClick={() => setActiveTab('open')}
          />

          {canSeeUrgency && (
            <InboxTabButton
              label="Needs attention"
              count={stats.urgent}
              active={activeTab === 'urgent'}
              onClick={() => setActiveTab('urgent')}
            />
          )}

          <InboxTabButton
            label="Resolved"
            count={stats.resolved}
            active={activeTab === 'resolved'}
            onClick={() => setActiveTab('resolved')}
          />

          <InboxTabButton
            label="Archived"
            count={stats.archived}
            active={activeTab === 'archived'}
            onClick={() => setActiveTab('archived')}
          />
        </div>

        {loading ? (
          <p className="hs-copy" style={{ textAlign: 'left' }}>
            Loading inbox...
          </p>
        ) : filteredThreads.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div style={{ display: 'grid', gap: '26px' }}>
            {needsAttention.length > 0 && (
              <ConversationSection title="Needs attention">
                {needsAttention.map((thread) => (
                  <ConversationRow
                    key={thread.id}
                    thread={thread}
                    canSeeUrgency={canSeeUrgency}
                    onOpen={() => router.push(`/inbox/${thread.id}`)}
                  />
                ))}
              </ConversationSection>
            )}

            {regularThreads.length > 0 && (
              <ConversationSection
                title={needsAttention.length > 0 ? 'Still Open' : 'Conversations'}
              >
                {regularThreads.map((thread) => (
                  <ConversationRow
                    key={thread.id}
                    thread={thread}
                    canSeeUrgency={canSeeUrgency}
                    onOpen={() => router.push(`/inbox/${thread.id}`)}
                  />
                ))}
              </ConversationSection>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ConversationSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          margin: '0 0 12px',
          color: 'var(--hs-text)',
          fontSize: '20px',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          border: '1px solid var(--hs-border)',
          borderRadius: '22px',
          overflow: 'hidden',
          background: 'white',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function ConversationRow({
  thread,
  canSeeUrgency,
  onOpen,
}: {
  thread: Thread;
  canSeeUrgency: boolean;
  onOpen: () => void;
}) {
  const urgency = getThreadUrgency(thread);
  const issue = getThreadIssue(thread);
  const stars = getThreadStars(thread);
  const isNewReply = hasNewCustomerReply(thread);
  const contact = getThreadContact(thread);
  const time = getRelativeTime(getThreadTime(thread));

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%',
        border: 'none',
        borderBottom: '1px solid var(--hs-border)',
        background: isNewReply ? '#F8FBFF' : 'white',
        padding: '18px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'grid',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '8px',
            }}
          >
            <strong
              style={{
                color: 'var(--hs-text)',
                fontSize: '15px',
              }}
            >
              {stars ? `${stars}★ feedback` : 'Feedback'}
            </strong>

            {isNewReply && <SmallBadge label="New reply" tone="blue" />}

            {canSeeUrgency && urgency >= 60 && (
              <SmallBadge label={getUrgencyLabel(urgency)} tone={urgency >= 85 ? 'red' : 'amber'} />
            )}
          </div>

          <p
            style={{
              margin: 0,
              color: 'var(--hs-text)',
              fontSize: '18px',
              lineHeight: 1.45,
              fontWeight: 750,
            }}
          >
            {issue}
          </p>
        </div>

        <span
          style={{
            color: 'var(--hs-muted)',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {time}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <p className="hs-disclaimer" style={{ margin: 0 }}>
          {contact}
        </p>

        <p
          style={{
            margin: 0,
            color: 'var(--hs-navy)',
            fontSize: '14px',
            fontWeight: 900,
            whiteSpace: 'nowrap',
          }}
        >
          Open →
        </p>
      </div>
    </button>
  );
}

function InboxTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid var(--hs-navy)' : '1px solid var(--hs-border)',
        background: active ? '#F5FAFF' : 'white',
        color: active ? 'var(--hs-navy)' : 'var(--hs-text)',
        borderRadius: '999px',
        padding: '9px 14px',
        fontWeight: 850,
        cursor: 'pointer',
      }}
    >
      {label} {count > 0 ? `(${count})` : ''}
    </button>
  );
}

function SmallBadge({ label, tone }: { label: string; tone: 'blue' | 'red' | 'amber' }) {
  const styles = {
    blue: {
      color: '#265D97',
      background: '#EAF3FF',
    },
    red: {
      color: '#B42318',
      background: '#FEF3F2',
    },
    amber: {
      color: '#B54708',
      background: '#FFFAEB',
    },
  }[tone];

  return (
    <span
      style={{
        borderRadius: '999px',
        padding: '5px 9px',
        fontSize: '12px',
        fontWeight: 900,
        ...styles,
      }}
    >
      {label}
    </span>
  );
}

function EmptyState({ activeTab }: { activeTab: InboxTab }) {
  const copy =
    activeTab === 'archived'
      ? 'Archived conversations will appear here.'
      : activeTab === 'resolved'
        ? 'Resolved conversations will appear here.'
        : 'Feedback that needs your attention will appear here.';

  return (
    <div
      style={{
        border: '1px dashed var(--hs-border)',
        borderRadius: '22px',
        padding: '34px',
        background: '#FBFAF7',
        textAlign: 'center',
      }}
    >
      <h3 style={{ margin: '0 0 8px', color: 'var(--hs-text)' }}>
        Nothing here right now
      </h3>

      <p className="hs-copy" style={{ margin: 0 }}>
        {copy}
      </p>
    </div>
  );
}