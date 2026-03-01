/** @type {import('next').NextConfig} */
const nextConfig = {
  // MANUAL TOGGLE:
  // - Leave this as 'export' when building for mobile (Capacitor/Appflow)
  // - Comment this out or delete it when pushing to Vercel for web!
  output: 'export',
  
  images: {
    unoptimized: true, // Always leave this on for mobile!
  }
};

export default nextConfig;