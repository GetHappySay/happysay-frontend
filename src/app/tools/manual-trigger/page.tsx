'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

const visitTypes = [
  { label: 'Service', value: 'service' },
  { label: 'Appointment', value: 'appointment' },
  { label: 'Purchase', value: 'purchase' },
  { label: 'Dine-in', value: 'dine-in' },
  { label: 'Takeout', value: 'takeout' },
  { label: 'Delivery', value: 'delivery' },
];

export default function ManualTriggerPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitType, setVisitType] = useState('service');
  const [delayMinutes, setDelayMinutes] = useState('0');
  const [sendNow, setSendNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  async function submitManualTrigger(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setStatus(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('happysay_token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const cleanPhone = phone.trim();

      if (!cleanPhone) {
        throw new Error('Phone number is required.');
      }

      const parsedDelay = sendNow ? 0 : Number(delayMinutes || 0);

      if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
        throw new Error('Delay must be a valid number.');
      }

      const res = await fetch(`${API_BASE}/api/customer/manual-trigger`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || 'Guest',
          phone: cleanPhone,
          visitType,
          delayMinutes: parsedDelay,
          sendNow,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not send feedback request.');
      }

      setStatus({
        type: 'success',
        message: formatSuccessMessage(data, sendNow),
      });

      if (sendNow) {
        setName('');
        setPhone('');
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '760px',
          width: '100%',
          padding: '32px',
          textAlign: 'left',
        }}
      >
        <a
          href="/tools"
          style={{
            display: 'inline-flex',
            marginBottom: '18px',
            color: 'var(--hs-navy)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 800,
          }}
        >
          ← Back to tools
        </a>

        <p
          style={{
            margin: '0 0 8px',
            color: 'var(--hs-muted)',
            fontSize: '14px',
            fontWeight: 800,
          }}
        >
          Manual feedback trigger
        </p>

        <h1 className="hs-title" style={{ margin: '0 0 8px' }}>
          Send a feedback request.
        </h1>

        <p
          className="hs-copy"
          style={{
            textAlign: 'left',
            margin: '0 0 24px',
            maxWidth: '620px',
          }}
        >
          Send a feedback request to a customer by phone number. Use this when you want to
          follow up after a visit, appointment, order, or service.
        </p>

        {status && (
          <div
            style={{
              border: `1px solid ${status.type === 'success' ? '#ABEFC6' : '#FECDCA'}`,
              borderRadius: '16px',
              padding: '14px',
              background: status.type === 'success' ? '#ECFDF3' : '#FEF3F2',
              color: status.type === 'success' ? '#067647' : '#B42318',
              fontSize: '14px',
              fontWeight: 800,
              marginBottom: '18px',
            }}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={submitManualTrigger} style={{ display: 'grid', gap: '16px' }}>
          <Field label="Customer name">
            <input
              className="hs-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest"
              type="text"
            />
          </Field>

          <Field label="Phone number">
            <input
              className="hs-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              type="tel"
              required
            />
          </Field>

          <Field label="Visit type">
            <select
              className="hs-input"
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
            >
              {visitTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <div
            style={{
              border: '1px solid var(--hs-border)',
              borderRadius: '16px',
              padding: '16px',
              background: '#FBFAF7',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--hs-text)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={sendNow}
                onChange={(e) => setSendNow(e.target.checked)}
              />
              Send immediately
            </label>

            {!sendNow && (
              <div style={{ marginTop: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: 'var(--hs-muted)',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  Delay in minutes
                </label>

                <input
                  className="hs-input"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="30"
                />
              </div>
            )}
          </div>

          <button type="submit" className="hs-button" disabled={loading}>
            <span className="hs-button-content">
              {loading ? 'Sending request...' : 'Send feedback request'}
            </span>
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span
        style={{
          color: 'var(--hs-muted)',
          fontSize: '13px',
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

function formatSuccessMessage(data: any, sendNow: boolean) {
  if (data?.message === 'duplicate_ignored') {
    return 'This feedback request was already scheduled.';
  }

  if (data?.message === 'scheduled_prompt_created') {
    if (sendNow) {
      return 'Feedback request sent.';
    }

    if (data?.scheduledFor) {
      const time = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(data.scheduledFor));

      return `Feedback request scheduled for ${time}.`;
    }

    return 'Feedback request scheduled.';
  }

  return 'Feedback request sent.';
}