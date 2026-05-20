'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type Thread = {
  id: string;
  status: string;
  archived?: boolean;
  lastCustomerReply?: string | null;
  feedbacks: {
    stars: number | null;
  }[];
  messages: {
    sender: string;
  }[];
};

type PositiveFeedback = {
  id: string;
  stars: number;
  comment: string;
  createdAt: string;
};

function clearAuthAndRedirect(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem('happysay_token');
  localStorage.removeItem('happysay_user');
  router.replace('/login');
}

function isAuthError(status?: number, message?: string) {
  const text = String(message || '').toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    text.includes('token') ||
    text.includes('unauthorized') ||
    text.includes('forbidden') ||
    text.includes('jwt')
  );
}

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

function isOpen(thread: Thread) {
  return !thread.archived && thread.status !== 'resolved';
}

export default function Home() {
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [positiveFeedback, setPositiveFeedback] = useState<PositiveFeedback[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const token = localStorage.getItem('happysay_token');
        const savedUser = localStorage.getItem('happysay_user');

        if (!token) {
          clearAuthAndRedirect(router);
          return;
        }

        const user = savedUser ? JSON.parse(savedUser) : null;
        const locationId = user?.locationId;

        if (!locationId) {
          throw new Error('Missing business location. Please log in again.');
        }

        const [inboxRes, positiveRes] = await Promise.all([
          fetch(`${API_BASE}/api/customer/inbox`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
          fetch(`${API_BASE}/api/analytics/basic/positive-feedback?locationId=${locationId}&limit=10`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
        ]);

        const inboxData = await inboxRes.json().catch(() => ({}));
        const positiveData = await positiveRes.json().catch(() => ({}));

        if (isAuthError(inboxRes.status, inboxData?.error)) {
          clearAuthAndRedirect(router);
          return;
        }

        if (!inboxRes.ok) throw new Error(inboxData?.error || 'Failed to load dashboard');
        if (!positiveRes.ok) throw new Error(positiveData?.error || 'Failed to load positive feedback');

        if (!isMounted) return;

        setThreads(inboxData.threads || []);
        setPositiveFeedback(positiveData.items || []);
        setError('');
      } catch (err: any) {
        const message = err.message || 'Failed to load dashboard';

        if (isAuthError(undefined, message)) {
          clearAuthAndRedirect(router);
          return;
        }

        if (!isMounted) return;
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    const interval = setInterval(loadDashboard, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const stats = useMemo(() => {
    const activeThreads = threads.filter((thread) => !thread.archived);
    const openThreads = activeThreads.filter(isOpen);
    const newReplies = activeThreads.filter(hasNewCustomerReply);
    const resolved = activeThreads.filter((thread) => thread.status === 'resolved');

    return {
      feedbackReceived: activeThreads.length + positiveFeedback.length,
      needsResponse: openThreads.length,
      newReplies: newReplies.length,
      resolved: resolved.length,
      positive: positiveFeedback.length,
    };
  }, [threads, positiveFeedback]);

  const headline =
    stats.newReplies > 0
      ? `${stats.newReplies} customer repl${stats.newReplies === 1 ? 'y' : 'ies'} waiting`
      : stats.needsResponse > 0
        ? `${stats.needsResponse} conversation${stats.needsResponse === 1 ? '' : 's'} to review`
        : stats.positive > 0
          ? `${stats.positive} 5-star feedback item${stats.positive === 1 ? '' : 's'} captured`
          : 'You’re all caught up';

  return (
    <main className="hs-page">
      <section className="hs-card" style={{ maxWidth: '1040px', width: '100%', textAlign: 'left', padding: '34px' }}>
        <header style={{ marginBottom: '26px' }}>
          <p style={{ margin: '0 0 8px', color: 'var(--hs-muted)', fontSize: '14px', fontWeight: 800 }}>
            Dashboard
          </p>

          <h1 className="hs-title" style={{ margin: 0 }}>
            {loading ? 'Loading your dashboard...' : headline}
          </h1>

          <p className="hs-copy" style={{ margin: '10px 0 0', textAlign: 'left', maxWidth: '660px' }}>
            See what needs attention and what customers are sharing.
          </p>
        </header>

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
            <br />
            <button
              type="button"
              onClick={() => clearAuthAndRedirect(router)}
              style={{ marginTop: '10px', border: 'none', background: 'transparent', color: 'var(--hs-navy)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Go to login
            </button>
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '16px' }}>
          <HeroCard
            label="Needs attention"
            value={loading ? '...' : String(stats.needsResponse)}
            body={stats.needsResponse > 0 ? 'Customer conversations to review.' : 'No customer conversations need attention right now.'}
            button="Open inbox"
            onClick={() => router.push('/inbox')}
          />

          <HeroCard
            label="Positive feedback"
            value={loading ? '...' : String(stats.positive)}
            body={stats.positive > 0 ? 'Positive notes customers shared with the team.' : '5-star feedback will appear here.'}
            button="View analytics"
            onClick={() => router.push('/analytics')}
          />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <MetricCard label="Feedback received" value={loading ? '...' : String(stats.feedbackReceived)} />
          <MetricCard label="Resolved" value={loading ? '...' : String(stats.resolved)} />
          <MetricCard label="Customer replies" value={loading ? '...' : String(stats.newReplies)} />
        </section>

        <section style={{ border: '1px solid var(--hs-border)', borderRadius: '24px', padding: '22px', background: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <DashboardNote
            title="What this means"
            body={
              stats.needsResponse > 0
                ? 'Start with open conversations. That is where HappySay helps you protect trust.'
                : stats.positive > 0
                  ? 'Customers are also telling you what is working. Those notes now live in Analytics.'
                  : 'Your response queue is clear. Keep your feedback link and signs visible.'
            }
          />

          <DashboardNote
            title="Next best action"
            body={stats.needsResponse > 0 ? 'Handle the newest customer conversations first.' : 'Review positive feedback or share your feedback tools.'}
            actionLabel={stats.needsResponse > 0 ? 'Go to inbox' : 'Open analytics'}
            onAction={() => router.push(stats.needsResponse > 0 ? '/inbox' : '/analytics')}
          />
        </section>
      </section>
    </main>
  );
}

function HeroCard({ label, value, body, button, onClick }: { label: string; value: string; body: string; button?: string; onClick?: () => void }) {
  return (
    <div style={{ border: '1px solid var(--hs-border)', borderRadius: '24px', padding: '24px', background: 'white' }}>
      <p style={{ margin: '0 0 8px', color: 'var(--hs-muted)', fontSize: '13px', fontWeight: 850 }}>{label}</p>
      <strong style={{ display: 'block', fontSize: '44px', lineHeight: 1, color: 'var(--hs-text)', letterSpacing: '-0.04em', marginBottom: '12px' }}>
        {value}
      </strong>
      <p className="hs-copy" style={{ margin: 0, textAlign: 'left' }}>{body}</p>
      {button && onClick && (
        <button type="button" onClick={onClick} className="hs-button" style={{ width: 'auto', borderRadius: '999px', marginTop: '20px' }}>
          {button}
        </button>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--hs-border)', borderRadius: '20px', padding: '18px', background: 'white' }}>
      <p style={{ margin: '0 0 8px', color: 'var(--hs-muted)', fontSize: '13px' }}>{label}</p>
      <strong style={{ fontSize: '30px', color: 'var(--hs-text)' }}>{value}</strong>
    </div>
  );
}

function DashboardNote({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ border: '1px solid var(--hs-border)', borderRadius: '20px', padding: '18px', background: '#FBFAF7' }}>
      <strong style={{ color: 'var(--hs-text)', fontSize: '16px' }}>{title}</strong>
      <p className="hs-disclaimer" style={{ margin: '8px 0 0' }}>{body}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} style={{ border: '1px solid var(--hs-border)', background: 'white', color: 'var(--hs-navy)', borderRadius: '999px', padding: '10px 14px', fontWeight: 850, cursor: 'pointer', marginTop: '14px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}