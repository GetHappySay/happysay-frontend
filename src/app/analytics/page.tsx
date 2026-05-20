'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type User = {
  locationId?: string;
};

type Plan = {
  tier?: string;
  label?: string;
};

type Features = {
  urgencyAI?: boolean;
  aiSummary?: boolean;
  aiReplyDrafts?: boolean;
  analyticsAdvanced?: boolean;
  advancedAnalytics?: boolean;
};

type CountData = Record<string, any>;

type PositiveFeedback = {
  id: string;
  stars: number;
  comment: string;
  source?: string | null;
  sentiment?: string | null;
  createdAt: string;
};

function getCount(data: CountData | null, keys: string[]) {
  if (!data) return 0;

  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number') return value;
  }

  return 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<CountData | null>(null);
  const [urgency, setUrgency] = useState<CountData | null>(null);
  const [positiveFeedback, setPositiveFeedback] = useState<PositiveFeedback[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Features>({});
  const [error, setError] = useState('');

  const canSeeAdvanced = Boolean(features.analyticsAdvanced || features.advancedAnalytics);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const token = localStorage.getItem('happysay_token');
        const savedUser = localStorage.getItem('happysay_user');

        if (!token) {
          router.replace('/login');
          return;
        }

        const user: User | null = savedUser ? JSON.parse(savedUser) : null;
        const locationId = user?.locationId;

        if (!locationId) {
          throw new Error('Missing business location. Please log in again.');
        }

        const [inboxRes, sentimentRes, urgencyRes, positiveRes] = await Promise.all([
          fetch(`${API_BASE}/api/customer/inbox`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
          fetch(`${API_BASE}/api/analytics/basic/sentiment?locationId=${locationId}`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
          fetch(`${API_BASE}/api/analytics/basic/urgency-trends?locationId=${locationId}`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
          fetch(`${API_BASE}/api/analytics/basic/positive-feedback?locationId=${locationId}&limit=6`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-store',
            },
          }),
        ]);

        const inboxData = await inboxRes.json();
        const sentimentData = await sentimentRes.json();
        const urgencyData = await urgencyRes.json();
        const positiveData = await positiveRes.json();

        if (!inboxRes.ok) throw new Error(inboxData?.error || 'Failed to load account analytics.');
        if (!sentimentRes.ok) throw new Error(sentimentData?.error || 'Failed to load sentiment analytics.');
        if (!urgencyRes.ok) throw new Error(urgencyData?.error || 'Failed to load feedback priority.');
        if (!positiveRes.ok) throw new Error(positiveData?.error || 'Failed to load positive feedback.');

        setPlan(inboxData.plan || null);
        setFeatures(inboxData.features || {});
        setSentiment(sentimentData?.sentiment || sentimentData || {});
        setUrgency(urgencyData || {});
        setPositiveFeedback(positiveData.items || []);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [router]);

  const sentimentStats = useMemo(() => {
    const positive = getCount(sentiment, ['positive', 'positiveCount']);
    const neutral = getCount(sentiment, ['neutral', 'neutralCount']);
    const negative =
      getCount(sentiment, ['negative', 'negativeCount']) +
      getCount(sentiment, ['frustrated']) +
      getCount(sentiment, ['angry']);

    const total = positive + neutral + negative;

    return { positive, neutral, negative, total };
  }, [sentiment]);

  const priorityStats = useMemo(() => {
    const normal = getCount(urgency, ['normal', 'low', 'normalCount']);
    const urgent = getCount(urgency, ['urgent', 'medium', 'urgentCount']);
    const critical = getCount(urgency, ['critical', 'high', 'emergency', 'criticalCount']);
    const total = normal + urgent + critical;

    return { normal, urgent, critical, total };
  }, [urgency]);

  const insight =
    sentimentStats.negative > 0
      ? 'You have feedback worth reviewing. This is where HappySay helps you catch issues early.'
      : positiveFeedback.length > 0
        ? 'Customers are sharing what they appreciate. These notes help you understand what is working.'
        : 'Once customers start leaving feedback, your trends will appear here.';

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
            Analytics
          </p>

          <h1 className="hs-title" style={{ margin: 0 }}>
            Understand what customers are telling you
          </h1>

          <p
            className="hs-copy"
            style={{
              margin: '10px 0 0',
              textAlign: 'left',
              maxWidth: '680px',
            }}
          >
            See customer sentiment, positive feedback, and patterns that help your team improve.
          </p>
        </header>

        {loading && (
          <p className="hs-copy" style={{ textAlign: 'left' }}>
            Loading analytics...
          </p>
        )}

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '22px',
                background: 'white',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--hs-text)' }}>
                Customer sentiment
              </h2>

              <p className="hs-disclaimer" style={{ margin: '6px 0 18px' }}>
                A quick read on how customers are feeling.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '14px',
                }}
              >
                <Stat label="Positive" value={sentimentStats.positive} />
                <Stat label="Neutral" value={sentimentStats.neutral} />
                <Stat label="Needs review" value={sentimentStats.negative} />
              </div>
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '22px',
                background: 'white',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--hs-text)' }}>
                Recent positive feedback
              </h2>

              <p className="hs-disclaimer" style={{ margin: '6px 0 18px' }}>
  Positive 4-star and 5-star notes customers shared with the team.
</p>

              {positiveFeedback.length === 0 ? (
                <EmptyState
                  title="No positive notes yet"
                  body="When customers leave a 5-star note, it will appear here."
                />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {positiveFeedback.map((item) => (
  <PositiveCard key={item.id} item={item} />
))}
                </div>
              )}
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '22px',
                background: 'white',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--hs-text)' }}>
                Feedback priority
              </h2>

              <p className="hs-disclaimer" style={{ margin: '6px 0 18px' }}>
                Helps you spot feedback that may need attention faster.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '14px',
                }}
              >
                <Stat label="Normal" value={priorityStats.normal} />
                <Stat label="Urgent" value={priorityStats.urgent} />
                <Stat label="Critical" value={priorityStats.critical} />
              </div>
            </section>

            <section
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '24px',
                padding: '22px',
                background: '#FBFAF7',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--hs-text)' }}>
                What this means
              </h2>

              <p className="hs-copy" style={{ margin: '8px 0 0', textAlign: 'left' }}>
                {insight}
              </p>
            </section>

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              <FeatureCard
                title="Resolution insights"
                body="See how quickly issues are being handled and where conversations are getting stuck."
                available={canSeeAdvanced}
                planLabel={plan?.label || 'your current plan'}
              />

              <FeatureCard
                title="Advanced trends"
                body="Track patterns over time so you can see whether customer experience is improving."
                available={canSeeAdvanced}
                planLabel={plan?.label || 'your current plan'}
              />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '20px',
        padding: '18px',
        background: '#FBFAF7',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--hs-muted)' }}>
        {label}
      </p>

      <strong style={{ fontSize: '30px', color: 'var(--hs-text)' }}>{value}</strong>
    </div>
  );
}

function PositiveCard({ item }: { item: PositiveFeedback }) {
  const label =
    item.stars === 4
      ? '4-star feedback'
      : item.stars === 5
        ? '5-star feedback'
        : `${item.stars}-star feedback`;

  return (
    <article
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '18px',
        padding: '16px',
        background: '#FBFAF7',
      }}
    >
      <p
        style={{
          margin: 0,
          color: 'var(--hs-text)',
          fontSize: '16px',
          lineHeight: 1.5,
          fontWeight: 750,
        }}
      >
        “{item.comment}”
      </p>

      <p className="hs-disclaimer" style={{ margin: '8px 0 0' }}>
        {label} · {formatDate(item.createdAt)}
      </p>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: '1px dashed var(--hs-border)',
        borderRadius: '18px',
        padding: '22px',
        background: '#FBFAF7',
        textAlign: 'center',
      }}
    >
      <strong style={{ color: 'var(--hs-text)' }}>{title}</strong>
      <p className="hs-disclaimer" style={{ margin: '8px 0 0' }}>
        {body}
      </p>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  available,
  planLabel,
}: {
  title: string;
  body: string;
  available: boolean;
  planLabel: string;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '22px',
        padding: '20px',
        background: available ? 'white' : '#FBFAF7',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <strong style={{ color: 'var(--hs-text)', fontSize: '16px' }}>{title}</strong>

        <span
          style={{
            borderRadius: '999px',
            padding: '6px 9px',
            fontSize: '12px',
            fontWeight: 850,
            background: available ? '#ECFDF3' : 'white',
            color: available ? '#067647' : 'var(--hs-muted)',
            border: '1px solid var(--hs-border)',
            whiteSpace: 'nowrap',
          }}
        >
          {available ? 'Available' : 'Upgrade when ready'}
        </span>
      </div>

      <p className="hs-disclaimer" style={{ margin: 0 }}>
        {available
          ? body
          : `${body} This is not required to use HappySay, but it can help as your feedback volume grows.`}
      </p>
    </div>
  );
}