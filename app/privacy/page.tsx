import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'calc(80px + env(safe-area-inset-top))', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '24px', border: '2px solid #111827', color: '#111827' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '10px' }}>Privacy Policy</h1>
          <p style={{ fontWeight: 'bold', color: '#6b7280', marginBottom: '30px' }}>Last Updated: February 2026</p>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>1. Information We Collect</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>When you use VIMciety, we collect the following types of information:</p>
            <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
              <li><strong>Account Information:</strong> Email address, username, display name, and profile pictures when you register.</li>
              <li><strong>User-Generated Content (UGC):</strong> Posts, text, links, and media that you choose to publish.</li>
              <li><strong>Interactions:</strong> Likes, comments, followers, and blocking/reporting actions.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>2. Device Permissions</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>To provide core functionality, the VIMciety mobile app may request the following native device permissions. You can revoke these at any time in your device settings:</p>
            <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Photo Library & Camera:</strong> We request access to your device's camera and photo gallery strictly to allow you to upload profile pictures (avatars/backgrounds) and attach media to your posts. We do not scan or access any photos other than the ones you explicitly choose to upload.</li>
              <li style={{ marginBottom: '8px' }}><strong>Microphone:</strong> We request microphone access solely to allow you to record and upload audio or video content directly to your VIMciety posts. Audio is only recorded when you actively initiate a recording.</li>
              <li style={{ marginBottom: '8px' }}><strong>Contacts:</strong> We may request access to your device's contact list to help you find and connect with friends who are already on VIMciety. Contact data is processed securely, used strictly for this "Find Friends" matching feature, and is <strong>never</strong> sold to third parties or used for unauthorized marketing.</li>
              <li><strong>No Cross-Site Tracking:</strong> VIMciety <strong>does not</strong> track your browsing history, collect website data outside of our platform, or track your activity across other companies' apps and websites.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>3. Data Deletion & Your Rights</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>You have the right to request the complete deletion of your account and all associated personal data at any time.</p>
            <Link href="/delete-account" style={{ display: 'inline-block', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '22px', textDecoration: 'none', fontWeight: 'bold' }}>
              Go to Account Deletion
            </Link>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>4. Contact Us</h2>
            <p style={{ lineHeight: '1.6' }}>If you have any questions about this Privacy Policy, please contact us at: <strong>admin@vimciety.com</strong></p>
          </section>

          <div style={{ marginTop: '40px', borderTop: '2px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
            <Link href="/" style={{ color: '#111827', fontWeight: 'bold', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}