'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [industry, setIndustry] = useState('restaurant');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (isSubmitting) return;

    setError('');

    if (!name || !email || !password || !businessName || !googleReviewUrl) {
      setError('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          industry,
          googleReviewUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = Array.isArray(data?.error)
          ? data.error.map((e: { message?: string }) => e.message).filter(Boolean).join(' ')
          : data?.error || 'Signup failed';

        throw new Error(errorMessage);
      }

      localStorage.setItem('happysay_token', data.token);

      router.push(`/onboarding-success?locationId=${data.location.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="hs-page">
      <div className="hs-card">
        <img src="/logo.svg" className="hs-logo" alt="HappySay Logo" />

        <h1 className="hs-title">Create your account</h1>

        <p className="hs-copy">Set up HappySay in under 60 seconds.</p>

        <div className="hs-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="hs-input"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="hs-input"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="hs-input"
          />

          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            className="hs-input"
          />

          <input
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="Google review link"
            className="hs-input"
          />

          <p className="hs-disclaimer" style={{ textAlign: 'left', marginTop: '-8px' }}>
            Paste your direct Google review link. It should start with https://
          </p>

          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="hs-input"
          >
            <option value="restaurant">Restaurant</option>
            <option value="salon">Salon</option>
            <option value="fitness">Fitness</option>
            <option value="retail">Retail</option>
            <option value="service">Service</option>
          </select>

          {error && <div className="hs-error">{error}</div>}

          <button onClick={handleSignup} className="hs-button" disabled={isSubmitting}>
            <span className="hs-button-content">
              {isSubmitting ? (
                <>
                  <span className="hs-spinner" />
                  Creating...
                </>
              ) : (
                'Create account'
              )}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}