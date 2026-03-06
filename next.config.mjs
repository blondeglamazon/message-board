/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================================
  // 📱 MOBILE CAPACITOR SETTINGS (Do not remove for Appflow)
  // ==========================================================
  // MANUAL TOGGLE:
  // - Leave this as 'export' when building for mobile (Capacitor/Appflow)
  // - Comment this out or delete it when pushing to Vercel for web!
 //output: 'export', 

  images: {
    unoptimized: true, // Always leave this on for mobile static exports!
  },

  // ==========================================================
  // 🔒 SECURITY SETTINGS
  // ==========================================================
  // Prevents source code from being exposed in production (App Store Requirement)
  productionBrowserSourceMaps: false,

  // ==========================================================
  // 🚀 PERFORMANCE & BUNDLE OPTIMIZATIONS
  // ==========================================================
  
  // Strips console.log in production to speed up the app
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // ✅ CORRECT PLACEMENT: Top-level turbopack config for Next.js 16+
  // Silences the crash when using custom Webpack rules.
  turbopack: {},

  // Force Next.js to aggressively share duplicate code chunks 
  // This slashes the app's JS bundle size and stops duplicate router modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2, // If a module is used in 2+ places, put it in a shared chunk!
            priority: 20,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;