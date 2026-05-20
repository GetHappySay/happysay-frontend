'use client';

const tools = [
  {
    title: 'Feedback link & QR',
    body: 'Share your HappySay feedback page with customers.',
    href: '/onboarding-success',
    cta: 'Open setup',
    status: 'Live',
  },
  {
    title: 'Manual feedback trigger',
    body: 'Send a feedback request to a customer by phone number.',
    href: '/tools/manual-trigger',
    cta: 'Open trigger',
    status: 'Core',
  },
  {
    title: 'NFC setup',
    body: 'Activate and manage HappySay signs.',
    href: '/tools/nfc',
    cta: 'Set up NFC',
    status: 'Coming next',
  },
  {
    title: 'Trigger settings',
    body: 'Control timing, cooldowns, and follow-up behavior.',
    href: '/tools/settings',
    cta: 'Open settings',
    status: 'Coming next',
  },
];

export default function ToolsPage() {
  return (
    <main className="hs-page">
      <section
        className="hs-card"
        style={{
          maxWidth: '980px',
          width: '100%',
          padding: '32px',
          textAlign: 'left',
        }}
      >
        <p style={{ margin: '0 0 8px', color: 'var(--hs-muted)', fontSize: '14px', fontWeight: 800 }}>
          Tools
        </p>

        <h1 className="hs-title" style={{ margin: '0 0 8px' }}>
          Set up and run HappySay.
        </h1>

        <p className="hs-copy" style={{ textAlign: 'left', margin: '0 0 24px', maxWidth: '680px' }}>
        Everything here helps you collect feedback, share your link, and send requests in seconds.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              style={{
                border: '1px solid var(--hs-border)',
                borderRadius: '20px',
                padding: '20px',
                background: '#FBFAF7',
                textDecoration: 'none',
                color: 'inherit',
                display: 'grid',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <h2 style={{ margin: 0, color: 'var(--hs-text)', fontSize: '21px' }}>
                  {tool.title}
                </h2>

                <span
                  style={{
                    height: 'fit-content',
                    borderRadius: '999px',
                    padding: '6px 10px',
                    background: tool.status === 'Live' ? '#ECFDF3' : '#F2F4F7',
                    color: tool.status === 'Live' ? '#067647' : '#667085',
                    fontSize: '12px',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tool.status}
                </span>
              </div>

              <p className="hs-disclaimer" style={{ margin: 0 }}>
                {tool.body}
              </p>

              <strong style={{ color: 'var(--hs-navy)', fontSize: '14px' }}>
                {tool.cta}
              </strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}