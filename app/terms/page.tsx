import Link from 'next/link';

export default function TermsOfUse() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'calc(80px + env(safe-area-inset-top))', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '24px', border: '2px solid #111827', color: '#111827' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '10px' }}>Terms of Use (EULA)</h1>
          <p style={{ fontWeight: 'bold', color: '#6b7280', marginBottom: '30px' }}>Last Updated: March 11, 2026</p>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>1. Agreement to Terms</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              By accessing or using the VIMciety mobile application and website (the "App"), you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the App. This agreement operates alongside the standard Apple End User License Agreement.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>2. User Content & Zero Tolerance Policy</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              VIMciety is a community platform. We have a <strong>zero-tolerance policy for objectionable content and abusive users</strong>. By using this App, you agree that you will not post, upload, or share content that is:
            </p>
            <ul style={{ lineHeight: '1.6', paddingLeft: '20px', marginBottom: '10px' }}>
              <li>Defamatory, discriminatory, or mean-spirited.</li>
              <li>Promoting violence, illegal acts, or self-harm.</li>
              <li>Sexually explicit or pornographic.</li>
              <li>Spam, unauthorized advertising, or infringing on intellectual property.</li>
            </ul>
            <p style={{ lineHeight: '1.6', fontWeight: 'bold' }}>
              There is no tolerance for objectionable content or abusive users. Any user found violating these rules will have their content removed immediately and their account permanently banned without prior notice.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>3. User Blocking & Reporting</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              To ensure a safe environment, VIMciety provides tools to block abusive users and flag objectionable content. Our moderation team reviews all flagged content within 24 hours and will remove the content and eject the user who provided the offending content.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>4. Subscriptions and Payments</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              Premium features (like VIM+ and Verified status) are offered as auto-renewing subscriptions. Payment will be charged to your Apple ID or Google Play account at confirmation of purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. You can manage and cancel your subscriptions in your device account settings.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>5. Contact Us</h2>
            <p style={{ lineHeight: '1.6' }}>If you have any questions about these Terms, please contact us at: <strong>vimciety@gmail.com</strong></p>
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