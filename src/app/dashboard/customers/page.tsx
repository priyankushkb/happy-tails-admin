'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { adminStyles } from '@/lib/admin-styles';

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  pets: Array<{
    id: string;
    name: string;
    breed: string;
    age: string;
  }>;
  bookings: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
    pet: {
      id: string;
      name: string;
    };
  }>;
};

export default function CustomersPage() {
  const router = useRouter();

  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
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
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Customer[]>('/admin/customers');
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers.');
      } finally {
        setLoading(false);
      }
    };

    if (hydrated && isAuthenticated && user?.role === 'ADMIN') {
      void loadCustomers();
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
          <h1 style={adminStyles.title}>Customers</h1>
          <p style={adminStyles.subtitle}>View customers, pets, and booking history.</p>
        </div>

        <button
          style={adminStyles.secondaryButton}
          onClick={() => router.push('/dashboard')}
        >
          Back to dashboard
        </button>
      </div>

      {loading ? <p style={adminStyles.text}>Loading customers...</p> : null}
      {error ? <p style={adminStyles.error}>{error}</p> : null}

      {!loading && customers.length === 0 ? (
        <div style={adminStyles.card}>No customers found.</div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {customers.map((customer) => (
          <button
            key={customer.id}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
          >
            <div style={adminStyles.card}>
              <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 22, color: '#111827' }}>
                {customer.fullName}
              </h2>
              <p style={adminStyles.text}>Email: {customer.email}</p>
              <p style={adminStyles.text}>Phone: {customer.phone || 'Not provided'}</p>
              <p style={adminStyles.text}>Pets: {customer.pets.length}</p>
              <p style={adminStyles.text}>Bookings: {customer.bookings.length}</p>
              <p style={{ ...adminStyles.text, color: '#1F6FEB', fontWeight: 700 }}>
                Open customer
              </p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}