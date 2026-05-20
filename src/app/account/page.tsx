'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  locationId?: string;
};

type Location = {
  id: string;
  name?: string | null;
  businessName?: string | null;
  tier?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        const token = localStorage.getItem('happysay_token');

        if (!token) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-store',
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load account.');
        }

        setUser(data.user || null);
        setLocation(data.location || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load account.');
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  async function openBillingPortal() {
    if (billingLoading) return;

    setError('');
    setBillingLoading(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const res = await fetch(`${API_BASE}/api/billing/create-portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not open billing portal.');
      }

      if (!data?.url) {
        throw new Error('Billing portal URL missing.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Could not open billing portal.');
      setBillingLoading(false);
    }
  }

  const hasBilling = Boolean(location?.stripeCustomerId);
  const planAction = getPlanAction(location, billingLoading);

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '760px',
          width: '100%',
          padding: '30px',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            color: 'var(--hs-muted)',
            fontSize: '14px',
            fontWeight: 800,
          }}
        >
          Account
        </p>

        <h1 className="hs-title" style={{ margin: '0 0 8px' }}>
          Your HappySay account
        </h1>

        <p className="hs-copy" style={{ textAlign: 'left', margin: '0 0 22px' }}>
          Manage your business details, plan, and billing.
        </p>

        {error && (
          <div className="hs-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="hs-copy" style={{ textAlign: 'left', margin: 0 }}>
            Loading account...
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <Field label="Name" value={user?.name || 'Not available'} />
            <Field label="Email" value={user?.email || 'Not available'} />
            <Field
              label="Business"
              value={location?.businessName || location?.name || 'Not available'}
            />

            <Field
              label="Password"
              value="••••••••"
              action="Reset password"
              href="/forgot-password"
            />

            <Field
              label="Plan"
              value={formatPlan(location?.tier)}
              subtext={formatSubscription(location)}
              action={planAction}
              href={hasBilling ? undefined : '/upgrade'}
              onAction={hasBilling ? openBillingPortal : undefined}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function getPlanAction(location: Location | null, billingLoading: boolean) {
  if (billingLoading) return 'Opening...';

  if (location?.stripeCustomerId) {
    return 'Manage billing';
  }

  return 'Upgrade plan';
}

function formatPlan(tier?: string | null) {
  if (!tier) return 'Not available';
  return `HappySay ${tier}`;
}

function formatSubscription(location?: Location | null) {
  const status = location?.subscriptionStatus;

  if (!status) return undefined;

  const statusMap: Record<string, string> = {
    trialing: 'Trial active',
    active: 'Active subscription',
    past_due: 'Payment needs attention',
    canceled: 'Canceled',
    incomplete: 'Checkout incomplete',
    unpaid: 'Payment required',
  };

  const label = statusMap[status] || status.replace(/_/g, ' ');

  if (!location?.currentPeriodEnd) {
    return label;
  }

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(location.currentPeriodEnd));

  if (status === 'active' || status === 'trialing') {
    return `${label}. Renews ${date}.`;
  }

  return `${label}. Current period ends ${date}.`;
}

function Field({
  label,
  value,
  subtext,
  action,
  href,
  onAction,
}: {
  label: string;
  value: string;
  subtext?: string;
  action?: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--hs-border)',
        borderRadius: '16px',
        padding: '15px',
        background: '#FBFAF7',
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontSize: '13px',
          color: 'var(--hs-muted)',
          fontWeight: 800,
        }}
      >
        {label}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <strong style={{ color: 'var(--hs-text)' }}>{value}</strong>

          {subtext && (
            <p className="hs-disclaimer" style={{ margin: '6px 0 0' }}>
              {subtext}
            </p>
          )}
        </div>

        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: '13px',
              fontWeight: 900,
              color: 'var(--hs-navy)',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {action}
          </button>
        )}

        {action && !onAction && (
          <a
            href={href || '#'}
            style={{
              fontSize: '13px',
              fontWeight: 900,
              color: 'var(--hs-navy)',
              textDecoration: 'none',
            }}
          >
            {action}
          </a>
        )}
      </div>
    </div>
  );
}