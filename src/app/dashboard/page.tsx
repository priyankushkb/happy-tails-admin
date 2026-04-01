'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { adminStyles } from '@/lib/admin-styles';

type BookingItem = {
  id: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
  pet: {
    id: string;
    name: string;
    breed: string;
    age: string;
  };
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        const data = await apiFetch<BookingItem[]>('/admin/bookings');
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings.');
      } finally {
        setLoadingBookings(false);
      }
    };

    if (hydrated && isAuthenticated && user?.role === 'ADMIN') {
      void loadBookings();
    }
  }, [hydrated, isAuthenticated, user]);

  if (!hydrated) {
    return <main style={adminStyles.centered}>Loading...</main>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <main style={adminStyles.page}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={adminStyles.title}>Dashboard</h1>
          <p style={adminStyles.subtitle}>Welcome {user.fullName}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            style={adminStyles.primaryButton}
            onClick={() => router.push('/dashboard/customers')}
          >
            Customers
          </button>

          <button
            style={adminStyles.secondaryButton}
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={adminStyles.sectionTitle}>Bookings</h2>

        {loadingBookings ? <p style={adminStyles.text}>Loading bookings...</p> : null}
        {error ? <p style={adminStyles.error}>{error}</p> : null}

        {!loadingBookings && bookings.length === 0 ? (
          <div style={adminStyles.card}>No bookings yet.</div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map((booking) => (
            <button
              key={booking.id}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
            >
              <div style={adminStyles.card}>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 20, color: '#111827' }}>
                  {booking.pet.name}
                </h3>
                <p style={adminStyles.text}>
                  Owner: {booking.owner.fullName} ({booking.owner.email})
                </p>
                <p style={adminStyles.text}>
                  {booking.startDate} to {booking.endDate}
                </p>
                <p style={adminStyles.text}>Status: {booking.status}</p>
                <p style={{ ...adminStyles.text, color: '#1F6FEB', fontWeight: 700 }}>
                  Open booking
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}