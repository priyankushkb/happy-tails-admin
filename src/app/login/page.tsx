'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { adminStyles } from '@/lib/admin-styles';

export default function LoginPage() {
  const router = useRouter();

  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && isAuthenticated && user?.role === 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);

      const currentUser = useAuthStore.getState().user;

      if (currentUser?.role !== 'ADMIN') {
        logout();
        setError('This account does not have admin access.');
        return;
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <main style={adminStyles.centered}>Loading...</main>;
  }

  return (
    <main style={adminStyles.page}>
      <div
        style={{
          maxWidth: 440,
          margin: '80px auto 0',
        }}
      >
        <div style={adminStyles.card}>
          <h1 style={adminStyles.title}>Happy Tails Admin</h1>
          <p style={adminStyles.subtitle}>Log in to manage bookings and customers.</p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 24,
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 600 }}>
              Email
              <input
                style={adminStyles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 600 }}>
              Password
              <input
                style={adminStyles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
              />
            </label>

            {error ? (
              <p style={{ ...adminStyles.error, whiteSpace: 'pre-wrap' }}>{error}</p>
            ) : null}

            <button style={adminStyles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}