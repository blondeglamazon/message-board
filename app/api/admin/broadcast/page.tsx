'use client';

import { useState } from 'react';

export default function AdminBroadcastDashboard() {
  const [adminSecret, setAdminSecret] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double confirmation to prevent accidental fat-finger sends!
    if (!window.confirm(`🚨 CAUTION: Are you absolutely sure you want to send this to EVERY user in the database?\n\nTitle: ${title}`)) {
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/admin/broadcast-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSecret}`
        },
        body: JSON.stringify({
          title,
          body,
          // Attaching the link so your mobile app can intercept and open it
          data: link ? { url: link } : {} 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send broadcast');
      }

      setStatus({ 
        type: 'success', 
        message: `✅ ${result.message}` 
      });
      
      // Clear the form on success
      setTitle('');
      setBody('');
      setLink('');
      
    } catch (error: any) {
      console.error('Broadcast Error:', error);
      setStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>System Broadcast</h1>
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>
          Send a push notification to every active device registered to VIMciety.
        </p>
      </div>

      <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Security Field */}
        <div style={{ backgroundColor: '#374151', padding: 16, borderRadius: 12, border: '1px solid #4B5563' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>
            Admin Secret Key
          </label>
          <input
            type="password"
            required
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Enter your secret password..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #4B5563', fontSize: 14, color: 'white', backgroundColor: '#1F2937', boxSizing: 'border-box' }}
          />
        </div>

        {/* Message Composition */}
        <div style={{ backgroundColor: '#1F2937', padding: 20, borderRadius: 12, border: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>Notification Title</label>
            <input
              type="text"
              required
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🚀 VIMciety Just Got an Upgrade!"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #4B5563', fontSize: 14, color: 'white', backgroundColor: '#374151', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>Message Body</label>
            <textarea
              required
              maxLength={150}
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Check out the new features we just dropped..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #4B5563', fontSize: 14, color: 'white', backgroundColor: '#374151', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
              {body.length}/150 characters
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>Deep Link URL (Optional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /post/12345 or /upgrade"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #4B5563', fontSize: 14, color: 'white', backgroundColor: '#374151', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Status Messages */}
        {status.type && (
          <div style={{ 
            padding: 16, 
            borderRadius: 8, 
            backgroundColor: status.type === 'success' ? '#064E3B' : '#7F1D1D',
            color: status.type === 'success' ? '#34D399' : '#FCA5A5',
            border: `1px solid ${status.type === 'success' ? '#059669' : '#DC2626'}`,
            fontSize: 14
          }}>
            {status.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !title || !body || !adminSecret}
          style={{ 
            padding: '14px', 
            borderRadius: 8, 
            border: 'none', 
            backgroundColor: isLoading || !title || !body || !adminSecret ? '#4B5563' : '#6366F1', 
            color: '#FFFFFF', 
            fontSize: 16, 
            fontWeight: 600, 
            cursor: isLoading || !title || !body || !adminSecret ? 'not-allowed' : 'pointer', 
            transition: 'background-color 0.2s',
            marginTop: 8
          }}
        >
          {isLoading ? 'Sending Broadcast...' : '🚀 Send to All Users'}
        </button>

      </form>
    </div>
  );
}