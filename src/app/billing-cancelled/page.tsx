'use client';

export default function BillingCancelledPage() {
  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '36px',
        }}
      >
        <h1 className="hs-title" style={{ margin: '0 0 10px' }}>
          Checkout not completed.
        </h1>

        <p className="hs-copy" style={{ margin: '0 0 22px' }}>
          Your plan hasn’t changed. You can return anytime to continue your upgrade.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <a href="/upgrade" className="hs-button" style={{ borderRadius: '999px' }}>
            View plans
          </a>

          <a
            href="/account"
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--hs-navy)',
              textDecoration: 'none',
              alignSelf: 'center',
            }}
          >
            Back to account
          </a>
        </div>
      </section>
    </main>
  );
}