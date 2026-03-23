import Link from 'next/link'

export default function SupportPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '60px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ 
        maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', 
        padding: '40px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
        textAlign: 'center' 
      }}>
        
        <h1 style={{ color: '#111827', fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>
          VIMciety Support
        </h1>
        
        <p style={{ color: '#4b5563', fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
          Need help with your account, encountered a bug, or want to request an account deletion? We are here to help.
        </p>
        
        <a 
          href="mailto:vimciety@gmail.com" 
          style={{ 
            display: 'inline-block', backgroundColor: '#111827', color: 'white', 
            padding: '14px 32px', borderRadius: '30px', textDecoration: 'none', 
            fontWeight: 'bold', fontSize: '18px', marginBottom: '30px'
          }}
        >
          Email Support
        </a>
        
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Or reach us directly at: <br/>
          <strong style={{ color: '#111827' }}>vimciety@gmail.com</strong>
        </p>
        
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '10px' }}>
          We typically respond within 24 hours.
        </p>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
               &larr; Back to VIMciety
            </Link>
        </div>

      </div>
    </div>
  )
}