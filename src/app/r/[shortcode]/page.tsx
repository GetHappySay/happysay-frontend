'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type PublicLocationResponse = {
  id: string;
  name: string;
  businessName?: string | null;
  shortcode?: string | null;
  googleReviewUrl?: string | null;
  tier?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function ShortcodeEntryPage() {
  const params = useParams<{ shortcode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const shortcode = params?.shortcode;

    if (!shortcode || typeof shortcode !== 'string') return;

    async function resolveAndRedirect() {
      const target = `${API_BASE}/api/public/location/${encodeURIComponent(shortcode)}`;
      console.log('API BASE:', API_BASE);
      console.log('Fetching from:', target);

      try {
        const res = await fetch(target, { cache: 'no-store' });

        if (!res.ok) {
          console.error('Location lookup failed with status:', res.status);
          router.replace('/not-found');
          return;
        }

        const location: PublicLocationResponse = await res.json();

        const nextParams = new URLSearchParams();

        nextParams.set('locationId', location.id);
        nextParams.set('shortcode', location.shortcode || shortcode);

        const v = searchParams.get('v');
        const source = searchParams.get('source');

        if (v) nextParams.set('v', v);
        if (source) nextParams.set('source', source);

        router.replace(`/feedback/rate?${nextParams.toString()}`);
      } catch (err) {
        console.error('Failed to resolve shortcode:', err);
        router.replace('/not-found');
      }
    }

    resolveAndRedirect();
  }, [params, router, searchParams]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#FBFAF7',
        color: '#37352F',
        fontFamily: 'sans-serif',
      }}
    >
      <div>Loading...</div>
    </main>
  );
}