import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delete Account | VIMciety',
  description: 'Instructions for account deletion.',
}

export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#5b7cc2' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Delete Your Account</h1>
      
      <p>At VIMciety, we respect your privacy and your right to control your data. If you wish to delete your account and permanently remove all associated data, please follow the instructions below.</p>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '30px', marginBottom: '10px' }}>What happens when I delete my account?</h2>
      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
        <li>Your profile, username, and bio will be permanently removed.</li>
        <li>All posts, comments, and media you have uploaded will be deleted.</li>
        <li>Your follower and following connections will be erased.</li>
        <li>This action <strong>cannot be undone</strong>.</li>
      </ul>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '30px', marginBottom: '10px' }}>How to Request Deletion</h2>
      
      <p><strong>Option 1: via the App</strong></p>
      <p>You can delete your account directly inside the VIMciety mobile app:</p>
      <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '20px' }}>
        <li>Open the app and navigate to your <strong>Profile</strong>.</li>
        <li>Tap the <strong>Settings</strong> icon (if available) or look for the "Danger Zone".</li>
        <li>Tap <strong>Delete Account</strong>.</li>
        <li>Confirm your choice.</li>
      </ol>

      <p><strong>Option 2: via Email Request</strong></p>
      <p>If you cannot access the app or prefer to do this via the web, you may request account deletion by emailing our support team:</p>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <p style={{ margin: 0 }}><strong>Email:</strong> <a href="mailto:support@vimciety.com" style={{ color: '#6366f1', fontWeight: 'bold' }}>support@vimciety.com</a></p>
        <p style={{ margin: '10px 0 0 0' }}><strong>Subject:</strong> Account Deletion Request</p>
        <p style={{ margin: '10px 0 0 0' }}>Please include your registered <strong>email address</strong> and <strong>username</strong> in the body of the email. We will process your request within 30 days.</p>
      </div>

      <p style={{ marginTop: '40px', fontSize: '14px', color: '#6b7280' }}>
        Note: We may retain certain data as required by law or for legitimate business purposes (e.g., fraud prevention) in accordance with our Privacy Policy.
      </p>
    </div>
  )
}