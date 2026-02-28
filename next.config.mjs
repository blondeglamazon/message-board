/** @type {import('next').NextConfig} */
const nextConfig = {
  // If we tell it we are building for Mobile, it exports statically. 
  // Otherwise (like on Vercel), it leaves it alone!
  output: process.env.VERCEL ? undefined : 'export',
  images: {
    unoptimized: true, // This is also required for Capacitor!
  }
};

export default nextConfig;