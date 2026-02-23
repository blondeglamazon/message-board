import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Child Safety Standards | VIMciety',
  description: 'VIMciety is committed to protecting minors and has a zero-tolerance policy for child exploitation.',
};

export default function ChildSafetyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
          <h1 style={{ color: '#111827', fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Child Safety Standards</h1>
          <p style={{ color: '#4b5563', fontSize: '16px', margin: 0 }}>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>1. Zero Tolerance Policy</h2>
          <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '15px' }}>
            VIMciety is fully committed to the safety and protection of minors. We maintain a strict, <strong>zero-tolerance policy</strong> against the sharing, publication, or promotion of Child Sexual Abuse Material (CSAM) and Child Sexual Abuse and Exploitation (CSAE).
          </p>
          <p style={{ color: '#374151', lineHeight: '1.6' }}>
            Any content that depicts, encourages, or promotes the sexual exploitation or abuse of children is strictly prohibited on our platform.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>2. Enforcement and Reporting to Authorities</h2>
          <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '15px' }}>
            If we detect or become aware of any CSAM or CSAE on VIMciety, we will take immediate and decisive action:
          </p>
          <ul style={{ color: '#374151', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '15px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Immediate Removal:</strong> The offending content will be permanently removed from the platform immediately.</li>
            <li style={{ marginBottom: '8px' }}><strong>Permanent Ban:</strong> The user account responsible for uploading, sharing, or requesting the material will be permanently terminated without the possibility of appeal.</li>
            <li style={{ marginBottom: '8px' }}><strong>Law Enforcement Reporting:</strong> We are legally obligated to, and strictly comply with, reporting any such material and the associated user data to the appropriate regional and national authorities, including the <strong>National Center for Missing & Exploited Children (NCMEC)</strong> and local law enforcement agencies.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>3. User Reporting (In-App)</h2>
          <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '15px' }}>
            We empower our community to help keep VIMciety safe. Users can report any concerning content directly within the app.
          </p>
          <p style={{ color: '#374151', lineHeight: '1.6' }}>
            To report a post: Click the <strong>"Report Post"</strong> button located directly on any user's post. Our moderation team reviews all reports within 24 hours. Reports involving potential child safety violations are prioritized for immediate review and escalation.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>4. Designated Point of Contact</h2>
          <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '15px' }}>
            For law enforcement inquiries, reports from child protection organizations, or urgent concerns regarding child safety, please contact our designated child safety compliance officer directly:
          </p>
          <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 5px 0', color: '#111827', fontWeight: 'bold' }}>Safety & Compliance Team</p>
            <p style={{ margin: 0, color: '#374151' }}>Email: <a href="mailto:blondeglamazon@gmail.com" style={{ color: '#2563eb', textDecoration: 'underline' }}>blondeglamazon@gmail.com</a></p>
          </div>
        </section>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Return to VIMciety
          </Link>
        </div>

      </div>
    </div>
  );
}