import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | VIMciety',
  description: 'Learn about VIMciety, the revolutionary social networking platform designed to bridge the gap between content creation, community engagement, and digital commerce.',
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        
        {/* Navigation / Back Button */}
        <div style={{ marginBottom: '30px' }}>
          <Link href="/" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            ← Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '20px', lineHeight: '1.2' }}>
            About VIMciety: The Future of Social Commerce
          </h1>
          
          <p style={{ marginBottom: '30px', fontSize: '18px', color: '#4b5563' }}>
            Welcome to VIMciety, a revolutionary social networking platform designed to bridge the gap between content creation, community engagement, and digital commerce. We bring together content creators, everyday users, and e-commerce merchants into one dynamic, interactive environment where community and commerce thrive together.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '40px', marginBottom: '16px' }}>
            Our Mission: Empowering Creators to Become Enterprises
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Our mission is simple: to empower content creators to operate as full-fledged digital businesses. The modern creator economy is fragmented, forcing influencers to send their followers across multiple platforms just to book a call, buy merchandise, or listen to a podcast.
          </p>
          <p style={{ marginBottom: '30px' }}>
            VIMciety solves this by allowing you to monetize all your social media content and deliver it to your audience in one centralized hub. You no longer need to go searching for your audience across the internet; we bring them directly to your digital storefront.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '40px', marginBottom: '16px' }}>
            Unmatched Monetization & Creator Tools
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Content creation is completely simplified and streamlined with VIMciety. We offer a suite of built-in tools designed specifically for digital entrepreneurs and merchants:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Rich Link Integration:</strong> Promote and advertise everything from your affiliate storefronts and standalone websites to ticket vendors for your live events directly within your profile header.</li>
            <li><strong>Integrated Scheduling & Paid Calls:</strong> VIMciety allows direct booking natively in your profile using Google Calendar and Calendly. You can seamlessly set up checkout processes to monetize your consultations and paid calls.</li>
            <li><strong>Multimedia Commerce:</strong> Your audience can stream your latest Spotify podcast episode or listen to your newly released tracks while simultaneously shopping your storefront and purchasing merchandise—all without ever leaving your profile.</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '40px', marginBottom: '16px' }}>
            Bringing the Fun Back to Social Media
          </h2>
          <p style={{ marginBottom: '16px' }}>
            For everyday users, the true fun of social media has returned. We believe that your digital space should be a reflection of your unique personality. VIMciety brings back the most loved customization features of the past and supercharges them with the technology of the future.
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Complete Profile Customization:</strong> Add your favorite music tracks, audiobooks, or podcast episodes directly into your profile header to share your "mood of the day" with your friends and followers.</li>
            <li><strong>Dynamic Backgrounds:</strong> Say goodbye to boring, uniform profiles. Customize your background using your own Canva designs or images to make your space feel deeply personal and share your latest life events.</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '40px', marginBottom: '16px' }}>
            Join the Community
          </h2>
          <p style={{ marginBottom: '30px' }}>
            Whether you are a creator looking to scale your brand, a merchant aiming to connect with a dedicated audience, or a user searching for a more authentic and personalized social experience, VIMciety is built for you. Welcome to the future of social networking. Welcome to VIMciety.
          </p>

          {/* Contact Section Box */}
          <div style={{ backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '12px', marginTop: '40px', borderLeft: '4px solid #6366f1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginTop: '0', marginBottom: '8px' }}>
              Contact Us
            </h3>
            <p style={{ margin: 0, color: '#4b5563' }}>
              For support, business inquiries, or to learn more about our platform, please reach out to our team at{' '}
              <a href="mailto:support@vimciety.com" style={{ color: '#6366f1', fontWeight: 'bold', textDecoration: 'none' }}>
                support@vimciety.com
              </a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}