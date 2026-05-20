'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

const plans = [
  {
    name: 'Core',
    key: 'core',
    lookupKey: 'plan_core_monthly',
    price: '$69',
    description:
      'For businesses that want a clean way to capture feedback and respond before issues grow.',
    features: [
      'QR and NFC feedback capture',
      'Customer feedback inbox',
      'Reply to customers',
      'Dashboard basics',
      'Manual feedback trigger',
    ],
    cta: 'Current plan',
    featured: false,
  },
  {
    name: 'Smart',
    key: 'smart',
    lookupKey: 'plan_smart_monthly',
    price: '$119',
    description: 'For owners who want help knowing what needs attention first.',
    features: [
      'Everything in Core',
      'AI urgency detection',
      'Customer concern summaries',
      'Priority sorting',
      'Multi-location support',
    ],
    cta: 'Upgrade to Smart',
    featured: true,
  },
  {
    name: 'Pro',
    key: 'pro',
    lookupKey: 'plan_pro_monthly',
    price: '$199',
    description:
      'For teams that want deeper automation, stronger insights, and faster response workflows.',
    features: [
      'Everything in Smart',
      'AI reply drafts',
      'Advanced analytics',
      'Google reply logging',
      'POS trigger support',
    ],
    cta: 'Upgrade to Pro',
    featured: false,
  },
];

export default function UpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function startCheckout(plan: (typeof plans)[number]) {
    if (plan.name === 'Core' || loadingPlan) return;

    setError('');
    setLoadingPlan(plan.key);

    try {
        const token = localStorage.getItem('happysay_token');
        const storedUser = localStorage.getItem('happysay_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        if (!token || !user?.locationId) {
          window.location.href = '/login';
          return;
        }

      const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `checkout:${plan.key}:${Date.now()}`,
        },
        body: JSON.stringify({
            lookupKey: plan.lookupKey,
            locationId: user.locationId,
            customerEmail: user.email,
          }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Could not start checkout.');
      }

      if (!data?.url) {
        throw new Error('Stripe checkout URL missing.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Could not start checkout.');
      setLoadingPlan(null);
    }
  }

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '1120px',
          width: '100%',
          padding: '32px',
          textAlign: 'left',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--hs-muted)',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            Plans
          </p>

          <h1 className="hs-title" style={{ margin: 0, fontSize: '34px' }}>
            Upgrade when you want HappySay to do more of the thinking.
          </h1>

          <p
            className="hs-copy"
            style={{
              textAlign: 'left',
              margin: '12px 0 0',
              maxWidth: '720px',
              fontSize: '16px',
            }}
          >
            Core gives you the essentials. Smart and Pro help your team spot problems faster,
            respond better, and understand what customers are really saying.
          </p>
        </div>

        {error && (
          <div className="hs-error" style={{ marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '18px',
          }}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              loading={loadingPlan === plan.key}
              disabled={Boolean(loadingPlan)}
              onUpgrade={() => startCheckout(plan)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  plan,
  loading,
  disabled,
  onUpgrade,
}: {
  plan: {
    name: string;
    key: string;
    lookupKey: string;
    price: string;
    description: string;
    features: string[];
    cta: string;
    featured: boolean;
  };
  loading: boolean;
  disabled: boolean;
  onUpgrade: () => void;
}) {
  const isCurrent = plan.name === 'Core';

  return (
    <article
      style={{
        border: plan.featured ? '2px solid #265D97' : '1px solid var(--hs-border)',
        borderRadius: '24px',
        padding: '22px',
        background: plan.featured ? '#F5FAFF' : 'white',
        boxShadow: plan.featured
          ? '0 18px 45px rgba(38, 93, 151, 0.12)'
          : '0 10px 30px rgba(16, 24, 40, 0.04)',
      }}
    >
      {plan.featured && (
        <span
          style={{
            display: 'inline-flex',
            marginBottom: '14px',
            borderRadius: '999px',
            padding: '6px 10px',
            background: '#EAF3FF',
            color: '#265D97',
            fontSize: '12px',
            fontWeight: 900,
          }}
        >
          Best next step
        </span>
      )}

      <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--hs-text)' }}>
        HappySay {plan.name}
      </h2>

      <div style={{ margin: '12px 0' }}>
        <strong style={{ fontSize: '34px', color: 'var(--hs-text)' }}>{plan.price}</strong>
        <span style={{ color: 'var(--hs-muted)', fontWeight: 700 }}> / month</span>
      </div>

      <p className="hs-disclaimer" style={{ margin: '0 0 18px', minHeight: '58px' }}>
        {plan.description}
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        disabled={isCurrent || disabled}
        className="hs-button"
        style={{
          width: '100%',
          borderRadius: '999px',
          opacity: isCurrent || disabled ? 0.55 : 1,
          cursor: isCurrent || disabled ? 'not-allowed' : 'pointer',
          marginBottom: '18px',
        }}
      >
        <span className="hs-button-content">
          {loading ? 'Starting checkout...' : plan.cta}
        </span>
      </button>

      <div style={{ display: 'grid', gap: '10px' }}>
        {plan.features.map((feature) => (
          <div
            key={feature}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              color: 'var(--hs-text)',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#067647', fontWeight: 900 }}>✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </article>
  );
}