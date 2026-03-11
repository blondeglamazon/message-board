import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'calc(80px + env(safe-area-inset-top))', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '24px', border: '2px solid #111827', color: '#111827' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '10px' }}>Privacy Policy</h1>
          <p style={{ fontWeight: 'bold', color: '#6b7280', marginBottom: '30px' }}>Last Updated: March 11, 2026</p>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>1. Information We Collect</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>When you use VIMciety, we collect the following types of information:</p>
            <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
              <li><strong>Account Information:</strong> Email address, username, display name, and passwords (managed securely via Supabase).</li>
              <li><strong>User-Generated Content (UGC):</strong> Posts, text, links, and media that you choose to publish.</li>
              <li><strong>Interactions:</strong> Likes, comments, followers, and blocking/reporting actions.</li>
              <li><strong>Device & Usage Data:</strong> Device ID, OS version, and log data to help us improve the app and prevent fraud.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>2. Cookies and Tracking Technologies</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              We may use cookies, web beacons, and other tracking technologies on the App to help customize our platform, securely manage your login sessions, and improve your overall experience. When you access the App, your personal information is not inherently collected through the use of tracking technology. You can set your browser or device to remove or reject cookies, but this may affect your ability to stay logged in.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>3. Device Permissions</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>To provide core functionality, the VIMciety mobile app may request the following native device permissions. You can revoke these at any time in your device settings:</p>
            <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Photo Library & Camera:</strong> We request access to your device's camera and photo gallery strictly to allow you to upload profile pictures and attach media to your posts. We do not scan or access any photos other than the ones you explicitly upload.</li>
              <li style={{ marginBottom: '8px' }}><strong>Microphone:</strong> We request microphone access solely to allow you to record and upload audio/video content directly to your posts. Audio is only recorded when you actively initiate it.</li>
              <li style={{ marginBottom: '8px' }}><strong>Contacts:</strong> We may request access to your device's contact list to help you find friends already on VIMciety. Contact data is processed securely and is <strong>never</strong> sold to third parties or used for marketing.</li>
              <li><strong>No Cross-Site Tracking:</strong> VIMciety <strong>does not</strong> track your browsing history or track your activity across other companies' apps and websites.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>4. Sharing Your Information & API Usage</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>We share data only when necessary to run our platform, such as with our secure database provider (Supabase) or when you interact with third-party embeds (like Spotify or Canva). We do not sell your personal data to data brokers.</p>
            
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '12px', marginTop: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Google API Services (Limited Use)</h3>
              <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                VIMciety's use and transfer to any other app of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>Google API Services User Data Policy</a>, including the Limited Use requirements. We request read/write access to Google Calendar strictly to allow users to book appointments on your profile. We do <strong>NOT</strong> share, sell, or transfer your Google Calendar data to any marketing platforms or advertising networks.
              </p>
            </div>
            
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '12px', marginTop: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>AI Features (Google Gemini)</h3>
              <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                When you use our "Magic Write" or "AI Story Assistant" features, the text prompt you provide is sent securely to Google's Gemini AI service to generate a response.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>5. Policy for Children</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>6. Data Deletion & Your Rights</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>You have the right to request the complete deletion of your account and all associated personal data at any time.</p>
            <Link href="/delete-account" style={{ display: 'inline-block', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '22px', textDecoration: 'none', fontWeight: 'bold' }}>
              Go to Account Deletion
            </Link>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>7. Contact Us</h2>
            <p style={{ lineHeight: '1.6' }}>If you have any questions about this Privacy Policy, please contact us at: <strong>vimciety@gmail.com</strong></p>
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