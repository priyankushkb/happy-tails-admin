'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { adminStyles } from '@/lib/admin-styles';

type Message = {
  id: string;
  text: string;
  sender: string;
  createdAt: string;
};

type BookingDetail = {
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
  messages: Message[];
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();

  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<BookingDetail>(`/admin/bookings/${params.bookingId}`);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && isAuthenticated && user?.role === 'ADMIN' && params.bookingId) {
      void loadBooking();
    }
  }, [hydrated, isAuthenticated, user, params.bookingId]);

  const updateStatus = async (
    status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    try {
      setUpdating(true);
      const updated = await apiFetch<BookingDetail>(`/admin/bookings/${params.bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking.');
    } finally {
      setUpdating(false);
    }
  };

  const sendMessage = async () => {
    if (!params.bookingId) return;
    if (!messageText.trim()) return;

    try {
      setSending(true);

      await apiFetch<Message>('/admin/messages', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: params.bookingId,
          text: messageText.trim(),
        }),
      });

      setMessageText('');
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!hydrated) {
    return <main style={adminStyles.centered}>Loading...</main>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <main style={adminStyles.page}>
      <button style={adminStyles.secondaryButton} onClick={() => router.push('/dashboard')}>
        Back to dashboard
      </button>

      {loading ? <p style={{ ...adminStyles.text, marginTop: 16 }}>Loading booking...</p> : null}
      {error ? <p style={{ ...adminStyles.error, marginTop: 16 }}>{error}</p> : null}

      {booking ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div style={adminStyles.card}>
            <h1 style={{ ...adminStyles.title, fontSize: 28 }}>Booking Detail</h1>
            <p style={adminStyles.text}><strong>Owner:</strong> {booking.owner.fullName}</p>
            <p style={adminStyles.text}><strong>Email:</strong> {booking.owner.email}</p>
            <p style={adminStyles.text}><strong>Phone:</strong> {booking.owner.phone || 'Not provided'}</p>
            <p style={adminStyles.text}><strong>Pet:</strong> {booking.pet.name}</p>
            <p style={adminStyles.text}><strong>Breed:</strong> {booking.pet.breed}</p>
            <p style={adminStyles.text}><strong>Age:</strong> {booking.pet.age}</p>
            <p style={adminStyles.text}><strong>Dates:</strong> {booking.startDate} to {booking.endDate}</p>
            <p style={adminStyles.text}><strong>Status:</strong> {booking.status}</p>
            <p style={adminStyles.text}><strong>Notes:</strong> {booking.notes || 'No notes'}</p>
          </div>

          <div style={adminStyles.card}>
            <h2 style={adminStyles.sectionTitle}>Booking Actions</h2>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                style={adminStyles.successButton}
                onClick={() => void updateStatus('CONFIRMED')}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>

              <button
                style={adminStyles.warningButton}
                onClick={() => void updateStatus('DECLINED')}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Decline'}
              </button>

              <button
                style={adminStyles.primaryButton}
                onClick={() => void updateStatus('COMPLETED')}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Mark Completed'}
              </button>

              <button
                style={adminStyles.dangerButton}
                onClick={() => void updateStatus('CANCELLED')}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Cancel'}
              </button>
            </div>
          </div>

          <div style={adminStyles.card}>
            <h2 style={adminStyles.sectionTitle}>Messages</h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginTop: 16,
                marginBottom: 20,
              }}
            >
              {booking.messages.length === 0 ? (
                <p style={adminStyles.text}>No messages yet.</p>
              ) : (
                booking.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      border: '1px solid #D6D3D1',
                      borderRadius: 14,
                      padding: 12,
                      background: message.sender === 'admin' ? '#EFF6FF' : '#FFFFFF',
                    }}
                  >
                    <p style={{ ...adminStyles.text, margin: 0, marginBottom: 8 }}>
                      {message.text}
                    </p>
                    <p style={{ ...adminStyles.muted, margin: 0, fontSize: 12 }}>
                      {message.sender} • {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 600 }}>
                Reply to customer
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your reply"
                  rows={4}
                  style={{
                    ...adminStyles.input,
                    resize: 'vertical',
                    minHeight: 100,
                  }}
                />
              </label>

              <button
                style={adminStyles.primaryButton}
                onClick={() => void sendMessage()}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}