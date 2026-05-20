'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

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
    createdAt: string;
    aiSummary?: string | null;
  }[];
};

type Plan = {
  tier?: string;
  label?: string;
};

type Features = {
  urgencyAI?: boolean;
  aiSummary?: boolean;
  aiReplyDrafts?: boolean;
};

function getLatestMessage(thread: Thread) {
  return thread.messages?.[0] || null;
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

function getThreadStars(thread: Thread) {
  return thread.feedbacks?.[0]?.stars ?? null;
}

function getThreadUrgency(thread: Thread) {
  return thread.feedbacks?.[0]?.urgencyScore ?? thread.urgencyScore ?? 0;
}

function isOpen(thread: Thread) {
  return !thread.archived && thread.status !== 'resolved';
}

function isPositive(thread: Thread) {
  const stars = getThreadStars(thread);
  return typeof stars === 'number' && stars >= 4 && !thread.archived;
}

export default function DashboardPage() {
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [features, setFeatures] = useState<Features>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canSeeUrgency = Boolean(features.urgencyAI);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem('happysay_token');

        if (!token) throw new Error('Please log in again.');

        const res = await fetch(`${API_BASE}/api/customer/inbox`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-store',
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || 'Failed to load dashboard');

        setThreads(data.threads || []);
        setFeatures(data.features || {});
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const activeThreads = threads.filter((thread) => !thread.archived);
    const openThreads = activeThreads.filter(isOpen);
    const newReplies = activeThreads.filter(hasNewCustomerReply);
    const resolved = activeThreads.filter((thread) => thread.status === 'resolved');
    const positive = activeThreads.filter(isPositive);
    const urgent = openThreads.filter((thread) => getThreadUrgency(thread) >= 60);

    return {
      feedbackReceived: activeThreads.length,
      needsResponse: openThreads.length,
      newReplies: newReplies.length,
      resolved: resolved.length,
      positive: positive.length,
      urgent: canSeeUrgency ? urgent.length : null,
    };
  }, [threads, canSeeUrgency]);

  const mainAction =
    stats.newReplies > 0
      ? `Reply to ${stats.newReplies} customer${stats.newReplies === 1 ? '' : 's'}`
      : stats.needsResponse > 0
        ? `Review ${stats.needsResponse} conversation${stats.needsResponse === 1 ? '' : 's'}`
        : 'Keep collecting feedback';

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '1040px',
          width: '100%',
          textAlign: 'left',
          padding: '34px',
        }}
      >
        <header style={{ marginBottom: '26px' }}>
          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--hs-muted)',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            Dashboard
          </p>

          <h1 className="hs-title" style={{ margin: 0 }}>
            {loading ? 'Loading your dashboard...' : mainAction}
          </h1>

          <p
            className="hs-copy"
            style={{
              margin: '10px 0 0',
              textAlign: 'left',
              maxWidth: '660px',
            }}
          >
            A simple view of what needs attention and how HappySay is helping your business.
          </p>
        </header>

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              border: '1px solid var(--hs-border)',
              borderRadius: '24px',
              padding: '24px',
              background: 'white',
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                color: 'var(--hs-muted)',
                fontSize: '13px',
                fontWeight: 850,
              }}
            >
              Needs attention
            </p>

            <strong
              style={{
                display: 'block',
                fontSize: '44px',
                lineHeight: 1,
                color: 'var(--hs-text)',
                letterSpacing: '-0.04em',
                marginBottom: '12px',
              }}
            >
              {loading ? '...' : stats.needsResponse}
            </strong>

            <p className="hs-copy" style={{ margin: 0, textAlign: 'left' }}>
              {stats.needsResponse > 0
                ? 'Customers are waiting for a response.'
                : 'No customer conversations need a response right now.'}
            </p>

            <button
              type="button"
              onClick={() => router.push('/inbox')}
              className="hs-button"
              style={{
                width: 'auto',
                borderRadius: '999px',
                marginTop: '20px',
              }}
            >
              Open inbox
            </button>
          </div>

          <div
            style={{
              border: '1px solid var(--hs-border)',
              borderRadius: '24px',
              padding: '24px',
              background: '#FBFAF7',
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                color: 'var(--hs-muted)',
                fontSize: '13px',
                fontWeight: 850,
              }}
            >
              New customer replies
            </p>

            <strong
              style={{
                display: 'block',
                fontSize: '44px',
                lineHeight: 1,
                color: 'var(--hs-text)',
                letterSpacing: '-0.04em',
                marginBottom: '12px',
              }}
            >
              {loading ? '...' : stats.newReplies}
            </strong>

            <p className="hs-copy" style={{ margin: 0, textAlign: 'left' }}>
              Replies from customers who are still reachable.
            </p>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <MetricCard label="Feedback received" value={loading ? '...' : String(stats.feedbackReceived)} />
          <MetricCard label="Resolved" value={loading ? '...' : String(stats.resolved)} />
          <MetricCard label="Positive feedback" value={loading ? '...' : String(stats.positive)} />
        </section>

        <section
          style={{
            border: '1px solid var(--hs-border)',
            borderRadius: '24px',
            padding: '22px',
            background: 'white',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px',
          }}
        >
          <DashboardNote
            title="What this means"
            body={
              stats.needsResponse > 0
                ? 'Start by replying to open customer conversations. That is where HappySay creates the most value.'
                : 'Your response queue is clear. Keep your feedback link and signs visible so customers can reach you easily.'
            }
          />

          <DashboardNote
            title="Next best action"
            body={
              stats.needsResponse > 0
                ? 'Go to the inbox and handle the newest replies first.'
                : 'Open Tools to share your link, send a feedback request, or manage your setup.'
            }
            actionLabel={stats.needsResponse > 0 ? 'Go to inbox' : 'Open tools'}
            onAction={() => router.push(stats.needsResponse > 0 ? '/inbox' : '/tools')}
          />
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '20px',
        padding: '18px',
        background: 'white',
      }}
    >
      <p style={{ margin: '0 0 8px', color: 'var(--hs-muted)', fontSize: '13px' }}>
        {label}
      </p>

      <strong style={{ fontSize: '30px', color: 'var(--hs-text)' }}>{value}</strong>
    </div>
  );
}

function DashboardNote({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '20px',
        padding: '18px',
        background: '#FBFAF7',
      }}
    >
      <strong style={{ color: 'var(--hs-text)', fontSize: '16px' }}>{title}</strong>

      <p className="hs-disclaimer" style={{ margin: '8px 0 0' }}>
        {body}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: '1px solid var(--hs-border)',
            background: 'white',
            color: 'var(--hs-navy)',
            borderRadius: '999px',
            padding: '10px 14px',
            fontWeight: 850,
            cursor: 'pointer',
            marginTop: '14px',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}