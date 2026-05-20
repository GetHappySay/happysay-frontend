'use client';

import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isCustomerFlow =
    pathname.startsWith('/feedback') ||
    pathname.startsWith('/reply/');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!isCustomerFlow && (
        <header
          style={{
            width: '100%',
            borderBottom: '1px solid var(--hs-border)',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '12px 20px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/"
              aria-label="HappySay dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <img
                src="/logo.svg"
                alt="HappySay"
                style={{
                  width: '120px',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </a>

            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <NavLink href="/" active={pathname === '/'}>
  Dashboard
</NavLink>

<NavLink href="/inbox" active={pathname.startsWith('/inbox')}>
  Inbox
</NavLink>

<NavLink href="/analytics" active={pathname.startsWith('/analytics')}>
  Analytics
</NavLink>

<NavLink href="/tools" active={pathname.startsWith('/tools')}>
  Tools
</NavLink>

<NavLink href="/account" active={pathname.startsWith('/account')}>
  Account
</NavLink>

<NavLink href="/upgrade" active={pathname.startsWith('/upgrade')}>
  Upgrade
</NavLink>
            </nav>
          </div>
        </header>
      )}

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        fontSize: '14px',
        fontWeight: 600,
        color: active ? 'var(--hs-text)' : '#667085',
        textDecoration: 'none',
        paddingBottom: '4px',
        borderBottom: active ? '2px solid #003566' : '2px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </a>
  );
}