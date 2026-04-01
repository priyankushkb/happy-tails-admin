'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { adminStyles } from '@/lib/admin-styles';

type CustomerDetail = {
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
    notes: string;
    status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
    pet: {
      id: string;
      name: string;
    };
    messages: Array<{
      id: string;
      text: string;
      sender: string;
      createdAt: string;
    }>;
  }>;
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ customerId: string }>();

  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
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
    const loadCustomer = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<CustomerDetail>(`/admin/customers/${params.customerId}`);
        setCustomer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer.');
      } finally {
        setLoading(false);
      }
    };

    if (hydrated && isAuthenticated && user?.role === 'ADMIN' && params.customerId) {
      void loadCustomer();
    }
  }, [hydrated, isAuthenticated, user, params.customerId]);

  if (!hydrated) {
    return <main style={adminStyles.centered}>Loading...</main>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <main style={adminStyles.page}>
      <button
        style={adminStyles.secondaryButton}
        onClick={() => router.push('/dashboard/customers')}
      >
        Back to customers
      </button>

      {loading ? <p style={{ ...adminStyles.text, marginTop: 16 }}>Loading customer...</p> : null}
      {error ? <p style={{ ...adminStyles.error, marginTop: 16 }}>{error}</p> : null}

      {customer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div style={adminStyles.card}>
            <h1 style={{ ...adminStyles.title, fontSize: 28 }}>{customer.fullName}</h1>
            <p style={adminStyles.text}><strong>Email:</strong> {customer.email}</p>
            <p style={adminStyles.text}><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
          </div>

          <div style={adminStyles.card}>
            <h2 style={adminStyles.sectionTitle}>Pets</h2>

            {customer.pets.length === 0 ? (
              <p style={adminStyles.text}>No pets found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {customer.pets.map((pet) => (
                  <div
                    key={pet.id}
                    style={{
                      border: '1px solid #D6D3D1',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <p style={adminStyles.text}><strong>Name:</strong> {pet.name}</p>
                    <p style={adminStyles.text}><strong>Breed:</strong> {pet.breed}</p>
                    <p style={adminStyles.text}><strong>Age:</strong> {pet.age}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={adminStyles.card}>
            <h2 style={adminStyles.sectionTitle}>Bookings</h2>

            {customer.bookings.length === 0 ? (
              <p style={adminStyles.text}>No bookings found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {customer.bookings.map((booking) => (
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
                    <div
                      style={{
                        border: '1px solid #D6D3D1',
                        borderRadius: 14,
                        padding: 12,
                        background: '#FFFFFF',
                      }}
                    >
                      <p style={adminStyles.text}><strong>Pet:</strong> {booking.pet.name}</p>
                      <p style={adminStyles.text}><strong>Dates:</strong> {booking.startDate} to {booking.endDate}</p>
                      <p style={adminStyles.text}><strong>Status:</strong> {booking.status}</p>
                      <p style={{ ...adminStyles.text, color: '#1F6FEB', fontWeight: 700 }}>
                        Open booking
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}