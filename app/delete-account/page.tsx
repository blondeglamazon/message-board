'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function DeleteAccountPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    })();
  }, [router, supabase]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your VIMciety account, your profile, your photos, your likes, your follows, and all your private data. Your posts and comments will remain visible to others but will show as "Deleted User". This cannot be undone. Are you absolutely sure?'
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete account');
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => {
        if (Capacitor.isNativePlatform()) {
          router.replace('/login');
        } else {
          router.replace('/');
        }
      }, 2500);

    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#111827' }}>Loading...</div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: 'min(600px, 92vw)', margin: '40px auto', padding: 24, textAlign: 'center', backgroundColor: '#ecfdf5', borderRadius: 12, color: '#065f46', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Account Deleted</h1>
        <p>Your VIMciety account and all associated data have been permanently removed.</p>
        <p style={{ marginTop: 12, fontSize: 14, color: '#047857' }}>Redirecting...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 'min(600px, 92vw)',
        margin: '0 auto',
        padding: '20px 16px 80px',
        fontFamily: 'sans-serif',
        color: '#111827',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Delete Account</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        You're signed in as <strong>{user.email}</strong>.
      </p>

      <section style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#991b1b', marginTop: 0, marginBottom: 12 }}>
          This action is permanent
        </h2>
        <p style={{ color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>
          Deleting your account cannot be undone. Please read what will happen before you continue.
        </p>
      </section>

      <section style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 10, color: '#374151' }}>
          What will be permanently deleted
        </h3>
        <ul style={{ color: '#4b5563', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>Your profile, username, bio, avatar, and background image</li>
          <li>All photos and media you've uploaded</li>
          <li>Your likes, follows, blocks, and notifications</li>
          <li>Your push notification tokens</li>
          <li>Your referral history and any pending payouts</li>
          <li>Your sales records stored in VIMciety's database</li>
          <li>Your authentication and login</li>
        </ul>
      </section>

      <section style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 10, color: '#374151' }}>
          What will remain
        </h3>
        <ul style={{ color: '#4b5563', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>
            <strong>Posts and comments you made</strong> will remain visible to other users so that
            conversations and threads are not broken. Your name will be replaced with "Deleted User"
            and will not be linked to you.
          </li>
          <li>
            <strong>Payout and sales history in Stripe.</strong> VIMciety uses Stripe to process
            payments and payouts. Stripe maintains its own independent record of your transactions
            for tax and regulatory reasons, and that data is not controlled by VIMciety. If you need
            your financial history after deleting, log in directly at{' '}
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
               style={{ color: '#2563eb' }}>dashboard.stripe.com</a>.
            To delete your Stripe account you must contact Stripe separately.
          </li>
          <li>
            <strong>Backup copies and audit logs.</strong> Routine encrypted backups may contain your
            data for up to 30 days before being overwritten, and an anonymized record of this
            deletion is retained for abuse prevention.
          </li>
        </ul>
      </section>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          width: '100%',
          padding: 16,
          backgroundColor: deleting ? '#9ca3af' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: deleting ? 'not-allowed' : 'pointer',
        }}
      >
        {deleting ? 'Permanently deleting...' : 'Permanently Delete My Account'}
      </button>

      <button
        onClick={() => router.back()}
        disabled={deleting}
        style={{
          width: '100%',
          padding: 16,
          marginTop: 10,
          backgroundColor: 'transparent',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
}