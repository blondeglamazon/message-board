import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================================
  // 📱 AUTOMATIC MOBILE CAPACITOR SETTINGS 
  // ==========================================================
  // ✅ MAGIC TOGGLE: Automatically turns on static export ONLY during mobile builds!
  // Vercel will ignore this and safely deploy your API routes.
  output: process.env.MOBILE_BUILD === 'true' ? 'export' : undefined, 

  images: {
    // Automatically disables Next.js image optimization ONLY for mobile apps
    unoptimized: process.env.MOBILE_BUILD === 'true' ? true : undefined,
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

// Wrap your existing config with the analyzer before exporting
export default bundleAnalyzer(nextConfig);
