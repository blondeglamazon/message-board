export default function BannedPage() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#ff4d4d' }}>🚫 Access Denied</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Your account has been restricted due to a violation of our community guidelines.
      </p>
      <a href="/" style={{ marginTop: '20px', color: '#0070f3', textDecoration: 'none' }}>
        Return to Home
      </a>
    </div>
  );
}